import { EverythingProviderAllLocalArgs, ExtractEverythingProviderAllLocalArgs, ExtractEverythingProviderAllLocalReturn } from '../gen/reactiveStorageTypes';
import * as vscode from 'vscode';

export type ExtraContext = {
	context: vscode.ExtensionContext;
};

type ActionMap = {
	[K in EverythingProviderAllLocalArgs['name']]?: (
		args: ExtractEverythingProviderAllLocalArgs<K>,
		extraContext: ExtraContext
	) => ExtractEverythingProviderAllLocalReturn<K>
};

const ACTION_REGISTRY: ActionMap = {};

export function registerAction<K extends EverythingProviderAllLocalArgs['name']>(
	name: K,
	action: (args: ExtractEverythingProviderAllLocalArgs<K>, extraContext: ExtraContext) => ExtractEverythingProviderAllLocalReturn<K>
) {
	// I tried finicking with this to get the TS to work, but to no avail
	// @ts-ignore
	ACTION_REGISTRY[name] = action;
}

export default ACTION_REGISTRY;
