import * as vscode from 'vscode';
import { Interceptor, Transport } from '@connectrpc/connect';
import { Disposable, ExtensionContext } from 'vscode';
import { randomUUID } from 'crypto';
import { createConnectTransport } from '@connectrpc/connect-node';
import { Cookie, CookieJar } from 'tough-cookie';

import { RepositoryService } from '../proto/aiserver/v1/repository_connectweb';
import { UploadService } from '../proto/aiserver/v1/uploadserver_connectweb';
import { willAccessTokenExpireSoon } from './auth/jwt';

const OVERRIDE_SERVICE_NAMES = [
	RepositoryService.typeName,
	UploadService.typeName,
] as const;

type OverrideServiceName = (typeof OVERRIDE_SERVICE_NAMES)[number];


export class AiConnectTransportHandler extends Disposable {
	private accessToken?: string;
	private disposables: vscode.Disposable[] = [];
	private cursorCreds?: vscode.cursor.CursorCreds;
	private cookieJar: CookieJar;
	private storedRandomness: string;

	private _overrideServiceNameToTransportMap: Record<OverrideServiceName, Transport | undefined> = {
		[RepositoryService.typeName]: undefined,
		[UploadService.typeName]: undefined,
	} as const;
	private _updateTransportMap(t: {
		repoTransport: Transport,
	}) {
		this._overrideServiceNameToTransportMap[RepositoryService.typeName] = t.repoTransport;
		this._overrideServiceNameToTransportMap[UploadService.typeName] = t.repoTransport;
	}

	constructor(
		context: ExtensionContext
	) {
		super(() => {
			this.disposables.forEach(sub => sub.dispose());
		});

		this.disposables.push(vscode.cursor.onDidChangeCursorAuthToken((
			(e: vscode.cursor.CursorAuthToken) => {
				this.accessToken = e;
			}
		)));
		this.disposables.push(vscode.cursor.onDidChangeCursorCreds((
			(e: vscode.cursor.CursorCreds) => {
				this.cursorCreds = e;

				this.setup();
			}
		)));
		const getInitialValues = async () => {
			while (this.cursorCreds === undefined) {
				this.accessToken = vscode.cursor.getCursorAuthToken();
				this.cursorCreds = vscode.cursor.getCursorCreds()

				await new Promise(resolve => setTimeout(resolve, 200));
			}

			this.setup();
		}
		this.cookieJar = new CookieJar();  // Create a new cookie jar for this transport
		this.storedRandomness = randomUUID();

		getInitialValues();
	}

	private _getTransportForService(serviceName: string): Transport | undefined {
		if (serviceName in this._overrideServiceNameToTransportMap) {
			return this._overrideServiceNameToTransportMap[serviceName as OverrideServiceName];
		}

		return this._backendTransport;
	}

	// TODO:
	// 1. http2 vs http1.1 cleverlness.
	// 2. recreate blah blah.

	private _backendTransport?: Transport;
	private _repoTransport?: Transport;
	private _ready: boolean = false;

	private setup() {
		this.createTransports();
		const transport = this.createMultiProxyTransport();

		vscode.cursor.registerConnectTransportProvider(transport);
	}

	/**
	 * This is the important function where we choose which Url to use for each service.
	 */
	private createMultiProxyTransport() {
		if (!this._ready) {
			throw new Error("INVARIANT VIOLATION: This should not be called without having this._ready.");
		}
		const t = this;

		const transport: Transport = {
			unary(service, method, signal, timeoutMs, header, input, contextValues) {
				const transport = t._getTransportForService(service.typeName);
				if (transport === undefined) {
					throw new Error("INVARIANT VIOLATION: Transport is undefined for service: " + service.typeName);
				}

				return transport.unary(service, method, signal, timeoutMs, header, input, contextValues);
			},
			stream(service, method, signal, timeoutMs, header, input, contextValues) {
				const transport = t._getTransportForService(service.typeName);
				if (transport === undefined) {
					throw new Error("INVARIANT VIOLATION: Transport is undefined for service: " + service.typeName);
				}

				return transport.stream(service, method, signal, timeoutMs, header, input, contextValues);
			},
		}
		return transport;
	}

	private createTransports() {
		const cursorCreds = this.cursorCreds;
		if (cursorCreds === undefined) {
			console.error("INVARIANT VIOLATION: CursorCreds is undefined");
			throw new Error("INVARIANT VIOLATION: CursorCreds is undefined");
		}

		const backendTransport = this.createCursorTransportWithUrl(cursorCreds.backendUrl);
		const repoTransport = this.createCursorTransportWithUrl(cursorCreds.repoBackendUrl);

		this._backendTransport = backendTransport;
		this._repoTransport = repoTransport;
		this._updateTransportMap({
			repoTransport: this._repoTransport,
		});
		this._ready = true;
	}

	private async createCookie(baseUrl: string, path: string, authId: string) {
		const myCookie = new Cookie({
			key: "CursorCookie",
			value: "Cookie-" + authId,
			domain: baseUrl,
			path: path.replace(baseUrl, ''),
			expires: new Date(Date.now() + (1000 * 60 * 60 * 24)), // expires in 1 day
			httpOnly: true,
			secure: true,
			sameSite: 'Strict'
		});
		this.cookieJar.setCookie(myCookie, baseUrl);
	}


	private createCursorTransportWithUrl(baseUrl: string): Transport {
		const interceptors = [];
		const bearerTokenInterceptor: Interceptor = (next) => async (req) => {
			if (this.accessToken === undefined) {
				return await next(req);
			}
			if (willAccessTokenExpireSoon(this.accessToken)) {
				this.scheduleRefreshAccessToken();
			}

			req.header.set("Authorization", `Bearer ${this.accessToken}`);
			return await next(req);
		};
		interceptors.push(bearerTokenInterceptor);

		const addHeaders: Interceptor = (next: any) => async (req: any) => {
			vscode.cursor.getAllRequestHeadersExceptAccessToken({ req: req, backupRequestId: randomUUID() })
			return await next(req);
		};
		interceptors.push(addHeaders);

		const cookieInterceptor: Interceptor = (next) => async (req) => {
			// Get cookies for the request URL and set the Cookie header
			const cookies = await this.cookieJar.getCookieString(baseUrl);
			if (cookies.length > 0) {
				req.header.set('Cookie', cookies);
			} else {
				this.createCookie(baseUrl, req.url, this.accessToken?.slice(0, 15) ?? this.storedRandomness);
				const cookies = await this.cookieJar.getCookieString(baseUrl);
				req.header.set('Cookie', cookies);
			}

			const response = await next(req);

			// Store cookies from the response
			if (response.header.has('Set-Cookie')) {
				const setCookieHeader = response.header.get('Set-Cookie');

				if (setCookieHeader !== undefined && setCookieHeader !== null) {
					await this.cookieJar.setCookie(setCookieHeader, baseUrl);
				}
			}

			return response;
		};
		interceptors.push(cookieInterceptor);


		const transport = createConnectTransport({
			httpVersion: '1.1',
			baseUrl: baseUrl,
			useBinaryFormat: true,
			interceptors,
		});

		return transport;
	}

	private scheduleRefreshAccessToken() {
		vscode.commands.executeCommand('cursorAuth.triggerTokenRefresh', true);
	}

}

