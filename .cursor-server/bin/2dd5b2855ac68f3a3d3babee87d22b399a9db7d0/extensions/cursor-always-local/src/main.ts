import { ExtensionContext } from 'vscode';
import * as vscode from 'vscode';
import { Requester } from './requester';
import { AlwaysLocalLogger } from './utils';
import { Differ } from './providers/diffMatchPatchProvider';
import { EverythingAlwaysLocalProviderCreator } from './providers/everythingLocalProvider';
import { AiConnectTransportHandler } from './aiConnectTransport/handler';

const deactivateTasks: { (): Promise<any> }[] = [];

export function activate(context: ExtensionContext) {
	AlwaysLocalLogger.init()

	const diffing = new Differ();
	deactivateTasks.push(async () => diffing.dispose());

	const requester = new Requester();
	deactivateTasks.push(async () => requester.dispose());

	const aiConnectTransport = new AiConnectTransportHandler(context);
	deactivateTasks.push(async () => aiConnectTransport.dispose());

	const everythingAlwaysLocalProviderCreator = new EverythingAlwaysLocalProviderCreator(context);
	deactivateTasks.push(async () => everythingAlwaysLocalProviderCreator.dispose());
}

export async function deactivate(): Promise<void> {
	for (const task of deactivateTasks) {
		await task();
	}
}
