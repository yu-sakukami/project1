import * as vscode from 'vscode';
import { AlwaysLocalLogger } from './utils';
import { RequesterProvider } from './gen/reactiveStorageTypes';

import { ConnectError, Interceptor, PromiseClient, createPromiseClient } from '@connectrpc/connect';
import { AiService } from './proto/aiserver/v1/aiserver_connectweb';
import { createConnectTransport } from '@connectrpc/connect-node';
import { generateUuid } from './utils';
import { randomUUID } from 'crypto';
import { GetChatRequest, GetFullFileMagicCommentsRequest, GetFullFileMagicCommentsResponse, NoTriggerMagicCommentsRequest, StreamChatContextRequest } from './proto/aiserver/v1/aiserver_pb';
import { AnyMessage, JsonValue, ServiceType } from '@bufbuild/protobuf';
import { CmdKService } from './proto/aiserver/v1/cmdk_connectweb';
import { StreamCmdKRequest, StreamHypermodeRequest, StreamTerminalCmdKRequest } from './proto/aiserver/v1/cmdk_pb';
import { ErrorDetails } from './proto/aiserver/v1/utils_pb';

export function getTracingHeaders(generationUUID: string) {
	return {
		'X-Request-ID': generationUUID,
		'X-Amzn-Trace-Id': `Root=${generationUUID}`,
	}
}

const METHOD_NAME_TO_REQUEST_TYPE: { [methodName: string]: (typeof GetChatRequest | typeof StreamChatContextRequest | typeof StreamCmdKRequest | typeof StreamTerminalCmdKRequest | typeof GetFullFileMagicCommentsResponse | typeof GetFullFileMagicCommentsRequest | typeof StreamHypermodeRequest | typeof NoTriggerMagicCommentsRequest) } = {
	'streamChat': GetChatRequest,
	'streamChatContext': StreamChatContextRequest,
	'streamCmdK': StreamCmdKRequest,
	'streamTerminalCmdK': StreamTerminalCmdKRequest,
	'streamChatWeb': GetChatRequest,
	'getFullFileMagicComments': GetFullFileMagicCommentsRequest,
	'streamHypermode': StreamHypermodeRequest,
	'noTriggerMagicComments': NoTriggerMagicCommentsRequest,
}

export class Requester implements vscode.Disposable {
	private backendUrl?: string;
	private disposables: vscode.Disposable[] = [];
	private accessToken?: string;
	private requestStateById: { [uuid: string]: { buffer: JsonValue[], abortController: AbortController, error?: Error, done?: boolean } } = {};

	constructor() {
		const requesterProvider: RequesterProvider = {
			request: async (methodName: string, _input: any): Promise<string> => {
				const headers = _input.headers;
				const input = _input.input;

				const uuidJustLocal = generateUuid();
				this.requestStateById[uuidJustLocal] = {
					buffer: [],
					abortController: new AbortController()
				}
				const aiClient = this.getClient(methodName);
				if (aiClient && typeof (aiClient as any)[methodName] === 'function') {
					const mappedInput = METHOD_NAME_TO_REQUEST_TYPE[methodName] !== undefined ? METHOD_NAME_TO_REQUEST_TYPE[methodName].fromJson(input) : input;

					const newResponse = (aiClient as any)[methodName](mappedInput, {
						signal: this.requestStateById[uuidJustLocal].abortController.signal,
						headers: headers
					}) as AsyncIterable<AnyMessage>;
					const restFunc = async () => {
						try {
							for await (const response of newResponse) {
								this.requestStateById[uuidJustLocal].buffer.push(response.toJson());
							}
						} catch (e) {
							AlwaysLocalLogger.error('Error', e);
							this.requestStateById[uuidJustLocal].error = e;
						} finally {
							this.requestStateById[uuidJustLocal].done = true;
						}
					};

					restFunc()
				} else {
					AlwaysLocalLogger.error('aiClient is undefined or does not have method', methodName);
					this.requestStateById[uuidJustLocal].done = true;
				}
				return uuidJustLocal;
			},
			flush: async (uuid: string): Promise<any[]> => {
				const err = this.requestStateById[uuid]?.error;
				if (err) {
					if (err instanceof ConnectError) {
						return [{
							error: {
								rawMessage: err.rawMessage,
								code: err.code as number,
								details: err.findDetails(ErrorDetails).map(detail => {
									return detail.toJson()
								}),
							},
							isErrorRequesterService: true,
							isErrorRequesterServiceConnectError: true
						}];
					}
					return [{
						error: {
							name: err.name,
							message: err.message,
							stack: err.stack,
						},
						isErrorRequesterService: true,
						isErrorRequesterServiceConnectError: false
					}];
				}
				if (!this.requestStateById[uuid]) {
					throw new Error(`No request state found for uuid ${uuid}`);
				}
				if (this.requestStateById[uuid]?.buffer.length === 0 && this.requestStateById[uuid]?.done) {
					return [null];
				}
				const toReturn = this.requestStateById[uuid].buffer;
				this.requestStateById[uuid].buffer = [];
				return toReturn;
			},
			cancel: async (uuid: string): Promise<void> => {
				if (this.requestStateById[uuid]) {
					this.requestStateById[uuid].abortController.abort();
				}
			}
		}
		vscode.cursor.registerRequesterProvider(requesterProvider);

		this.disposables.push(vscode.cursor.onDidChangeCursorAuthToken((
			(e: vscode.cursor.CursorAuthToken) => {
				this.accessToken = e;
				this.aiClient = undefined;
				this.cmdkClient = undefined;
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
		getInitialValues();
	}

	getClient(methodName: string) {
		if (['streamCmdK', 'streamTerminalCmdK', 'streamHypermode'].includes(methodName)) {
			return this.getCmdkClient();
		}
		return this.getAIClient();
	}

	private aiClient: PromiseClient<typeof AiService> | undefined = undefined;
	getAIClient(): PromiseClient<typeof AiService> | undefined {
		if (this.aiClient === undefined) {
			this.aiClient = this.createAIClient(AiService);
		}
		return this.aiClient;
	}

	private cmdkClient: PromiseClient<typeof CmdKService> | undefined = undefined;
	getCmdkClient(): PromiseClient<typeof CmdKService> | undefined {
		if (this.cmdkClient === undefined) {
			this.cmdkClient = this.createAIClient(CmdKService);
		}
		return this.cmdkClient;
	}

	private createAIClient<T extends ServiceType>(service: T): PromiseClient<T> | undefined {
		if (this.backendUrl === undefined) {
			return undefined;
		}
		const interceptors = [];

		const bearerTokenInterceptor: Interceptor = (next) => async (req) => {
			// If this isn't set, we'll just get a logged out error
			req.header.set("Authorization", `Bearer ${this.accessToken ?? ''}`);

			return await next(req);
		};
		interceptors.push(bearerTokenInterceptor);

		const addHeaders: Interceptor = (next: any) => async (req: any) => {
			vscode.cursor.getAllRequestHeadersExceptAccessToken({ req: req, backupRequestId: randomUUID() })

			return await next(req);
		};
		interceptors.push(addHeaders);

		const transport = createConnectTransport({
			httpVersion: '1.1',
			baseUrl: this.backendUrl,
			useBinaryFormat: true,
			interceptors,
		});
		return createPromiseClient(service, transport);
	}

	dispose() {
		this.disposables.forEach(disposable => disposable.dispose());
		this.disposables = [];
	}
}