import ACTION_REGISTRY, { ExtraContext } from './registry';
import './editHistoryFormatterSingleton';
import { EverythingProviderAllLocalArgs, ExtractEverythingProviderAllLocalArgs, ExtractEverythingProviderAllLocalReturn } from '../gen/reactiveStorageTypes';


export function getCommandFromRegistry<K extends EverythingProviderAllLocalArgs['name']>(commandName: K): ((args: ExtractEverythingProviderAllLocalArgs<K>, extraContext: ExtraContext) => ExtractEverythingProviderAllLocalReturn<K>) | undefined {
	// @ts-ignore (Needed for gulpfile building only)
	return ACTION_REGISTRY[commandName];
}
