import { EverythingProviderAllLocal, EverythingProviderAllLocalArgs, ExtractEverythingProviderAllLocalReturn, GHOST_MODE_HEADER_NAME, TreeSitterActions, ghostModeHeaderValue } from '../gen/reactiveStorageTypes';
import { createConnectTransport } from '@connectrpc/connect-node';
import * as vscode from 'vscode';
import { getCommandFromRegistry } from '../commands/registryAll';
import { Interceptor, PromiseClient, createPromiseClient } from '@connectrpc/connect';
import { AiService } from '../proto/aiserver/v1/aiserver_connectweb';
import { registerAction } from '../commands/registry';
import { randomUUID } from 'crypto';
// import { trimObjectRecursivelyWithDeepCopy } from '../utils/trimmer';

export class EverythingAlwaysLocalProviderCreator implements vscode.Disposable {
	private disposables: vscode.Disposable[] = [];

	private accessToken?: string;
	private backendUrl?: string;
	private aiClient: PromiseClient<typeof AiService> | undefined = undefined;
	private ghostMode?: boolean;

	getAIClient(): PromiseClient<typeof AiService> | undefined {
		if (this.aiClient === undefined) {
			this.aiClient = this.createAIClient(false);
		}
		return this.aiClient;
	}

	private createAIClient(isCpp: boolean, _accessToken?: string): PromiseClient<typeof AiService> | undefined {
		const backendUrl = this.backendUrl;
		if (backendUrl === undefined) {
			return undefined;
		}
		const accessToken = _accessToken ?? this.accessToken
		if (accessToken === undefined) {
			return undefined;
		}
		const interceptors = [];

		const bearerTokenInterceptor: Interceptor = (next) => async (req) => {
			req.header.set("Authorization", `Bearer ${accessToken}`);

			return await next(req);
		};
		interceptors.push(bearerTokenInterceptor);

		const addHeaders: Interceptor = (next: any) => async (req: any) => {
			vscode.cursor.getAllRequestHeadersExceptAccessToken({ req: req, backupRequestId: randomUUID() })

			return await next(req);
		};
		interceptors.push(addHeaders);

		const transport = createConnectTransport({
			httpVersion: isCpp && backendUrl.includes('api3.cursor') ? '2' : '1.1',
			baseUrl: backendUrl,
			useBinaryFormat: true,
			interceptors,
		});
		return createPromiseClient(AiService, transport);
	}


	constructor(context: vscode.ExtensionContext) {
		this.disposables.push(vscode.cursor.onDidChangeCursorAuthToken((
			(e: vscode.cursor.CursorAuthToken) => {
				this.accessToken = e;
				this.aiClient = undefined;
			}
		)));

		this.disposables.push(vscode.cursor.onDidChangeCursorCreds((
			(e: vscode.cursor.CursorCreds) => {
				this.backendUrl = e.backendUrl
			}
		)));

		const getInitialValues = async () => {
			while (this.backendUrl === undefined) {
				this.accessToken = vscode.cursor.getCursorAuthToken();
				this.backendUrl = vscode.cursor.getCursorCreds()?.backendUrl
			}
		}

		getInitialValues().then(() => { }).catch();

		const everythingProvider: EverythingProviderAllLocal = {
			// @ts-ignore (Needed for gulpfile building only)
			runCommand: <K extends EverythingProviderAllLocalArgs['name']>(commandName: K, args: ExtractEverythingProviderAllLocalArgs<K>): ExtractEverythingProviderAllLocalReturn<K> | Promise<undefined> => {

				// let argstrimmed = trimObjectRecursivelyWithDeepCopy(args);
				// CursorDebugLogger.info(`Running command: ${commandName} with args: ${JSON.stringify(argstrimmed)}`);

				const command = getCommandFromRegistry(commandName);
				if (command !== undefined) {
					// Also seemingly needed ts-ignore
					// @ts-ignore
					return command(args, { context: context });
				}

				return Promise.resolve(undefined);
			}
		}
		vscode.cursor.registerEverythingProviderAllLocal(everythingProvider);
	}

	dispose() {
		this.disposables.forEach((disposable) => disposable.dispose());
	}
}

