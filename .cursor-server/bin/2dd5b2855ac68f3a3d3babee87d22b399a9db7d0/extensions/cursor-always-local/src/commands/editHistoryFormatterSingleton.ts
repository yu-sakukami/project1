import { ExtraContext, registerAction } from './registry';
import { EditHistoryFormatter, changeModel, computeDeletedAddedRanges, getNewLineRange, getOldLineRange } from './cppUtils/utils';
import { IRange } from './cppUtils/types';
import { EditHistoryActions, EverythingProviderAllLocalArgs, IModelContentChange } from '../gen/reactiveStorageTypes';

const undefinedFuture = Promise.resolve(undefined);

export const SET_DEFAULT_CPP_MERGE_BEHAVIOR_TO_MERGED = false

function getStringRangeFromIRange(text: string, range: IRange) {
	return getStringRange(text, {
		startColumn: range.startColumn,
		startLineNumber: range.startLineNumber,
		endColumn: range.endColumn,
		endLineNumberInclusive: range.endLineNumber
	});
}

function getStringRange(text: string, range: { startLineNumber: number, endLineNumberInclusive: number, startColumn: number, endColumn: number }) {
	let lines = text.split('\n');
	const startLineNumberZeroIndexed = range.startLineNumber - 1;
	const endLineNumberZeroIndexedInclusive = range.endLineNumberInclusive - 1;
	const startColumnZeroIndexed = range.startColumn - 1;
	const endColumnZeroIndexed = range.endColumn - 1;
	lines = lines.slice(startLineNumberZeroIndexed, endLineNumberZeroIndexedInclusive + 1);
	if (lines.length === 1) {
		lines[0] = lines[0].slice(startColumnZeroIndexed, endColumnZeroIndexed);
	} else {
		lines[0] = lines[0].slice(startColumnZeroIndexed);
		lines[lines.length - 1] = lines[lines.length - 1].slice(0, endColumnZeroIndexed);
	}
	return lines.join('\n');
}

const cppEditHistoryDiffFormatter = new EditHistoryFormatter({})
const cmdkEditHistoryDiffFormatter = new EditHistoryFormatter({ gitDiffExtraContextRadius: 1 });

/* Edit History Formatter */
registerAction(EditHistoryActions.Ack, async (args, extras: ExtraContext) => {
	return true;
});

registerAction(EditHistoryActions.GetModelValue, async (args, extras: ExtraContext) => {
	return cppEditHistoryDiffFormatter.getModelValue(args.relativePath);
});

registerAction(EditHistoryActions.GetModelValueInRanges, async (args, extras: ExtraContext) => {
	const bigString = cppEditHistoryDiffFormatter.getModelValue(args.relativePath);
	if (bigString === undefined) {
		return undefined;
	}
	return args.ranges.map(range => getStringRangeFromIRange(bigString, range));
});

const tasks: EverythingProviderAllLocalArgs[] = []

const clear = async () => {
	await cppEditHistoryDiffFormatter.acquireLock();
	try {
		while (tasks.length > 0) {
			const task = tasks.shift();
			if (task === undefined) {
				break;
			}

			if (task.name === EditHistoryActions.ProcessManyModelChange) {
				const changes = task.args.changes as IModelContentChange[];
				let oldModelValue = cppEditHistoryDiffFormatter.getModelValue(task.args.uniqueModelIdentifier);
				for (let i = 0; i < changes.length; i++) {
					const change = changes[i];
					// const callback = (i === changes.length - 1) ? callbackAfterLastEvent : undefined;
					if (oldModelValue === undefined) {
						continue;
					}
					const newModelValue = changeModel(oldModelValue, change);
					await cppEditHistoryDiffFormatter.processModelChange({
						...task.args,
						change,
						newModelValue,
						deletedRangeInOldModelOneIndexed: getOldLineRange(change),
						addedRangeInNewModelOneIndexed: getNewLineRange(change),
						mergingBehavior: SET_DEFAULT_CPP_MERGE_BEHAVIOR_TO_MERGED ? {
							type: 'merged diff history',
							radius: 1
						} : undefined
					});


					if (task.args.isDev) {
						await cmdkEditHistoryDiffFormatter.processModelChange({
							...task.args,
							change,
							newModelValue,
							deletedRangeInOldModelOneIndexed: getOldLineRange(change),
							addedRangeInNewModelOneIndexed: getNewLineRange(change),
							mergingBehavior: {
								type: 'merged diff history',
								radius: 1
							}
						});
					}

					oldModelValue = newModelValue;
				}
			} else if (task.name === EditHistoryActions.ProcessModelChangeMaybeUnordered) {
				const { newModelValue } = task.args;
				const past = cppEditHistoryDiffFormatter.getModelValue(task.args.uniqueModelIdentifier);
				if (past === undefined) {
					continue;
				}

				const res = await computeDeletedAddedRanges({ past: past, current: newModelValue })
				if (res === undefined) {
					continue;
				}
				const { oldRange, newRange } = res;

				await cppEditHistoryDiffFormatter.processModelChange({
					...task.args,
					deletedRangeInOldModelOneIndexed: oldRange,
					addedRangeInNewModelOneIndexed: newRange,
					mergingBehavior: SET_DEFAULT_CPP_MERGE_BEHAVIOR_TO_MERGED ? {
						type: 'merged diff history',
						radius: 1
					} : undefined
				});

				if (task.args.isDev) {
					const cmdkPast = cmdkEditHistoryDiffFormatter.getModelValue(task.args.uniqueModelIdentifier);
					if (cmdkPast === undefined) {
						continue;
					}

					const cmdkRes = await computeDeletedAddedRanges({ past: cmdkPast, current: newModelValue })
					if (cmdkRes === undefined) {
						continue;
					}
					const { oldRange: cmdkOldRange, newRange: cmdkNewRange } = cmdkRes;

					await cmdkEditHistoryDiffFormatter.processModelChange({
						...task.args,
						deletedRangeInOldModelOneIndexed: cmdkOldRange,
						addedRangeInNewModelOneIndexed: cmdkNewRange,
						mergingBehavior: {
							type: 'merged diff history',
							radius: 1
						}
					});
				}
			} else if (task.name === EditHistoryActions.ProcessModelChange) {
				await cppEditHistoryDiffFormatter.processModelChange({
					...task.args,
					mergingBehavior: SET_DEFAULT_CPP_MERGE_BEHAVIOR_TO_MERGED ? {
						type: 'merged diff history',
						radius: 1
					} : undefined
				});


				if (task.args.isDev) {
					await cmdkEditHistoryDiffFormatter.processModelChange({
						...task.args,
						mergingBehavior: {
							type: 'merged diff history',
							radius: 1
						}
					});
				}
			} else if (task.name === EditHistoryActions.InitModel) {
				cppEditHistoryDiffFormatter.initModel(task.args.relativePath, task.args.currentModelValue, task.args.realRelativePath);
				if (task.args.isDev) {
					cmdkEditHistoryDiffFormatter.initModel(task.args.relativePath, task.args.currentModelValue, task.args.realRelativePath);
				}
			}
		}
	} finally {
		cppEditHistoryDiffFormatter.releaseLock();
	}
}
registerAction(EditHistoryActions.ProcessManyModelChange, async (args: any, extras: ExtraContext) => {
	tasks.push({
		name: EditHistoryActions.ProcessManyModelChange, args: {
			...args,
			isDev: extras.context.isDevelopment
		}, return: undefinedFuture
	})
	await clear();
});

registerAction(EditHistoryActions.ProcessModelChange, async (args, extras: ExtraContext) => {
	tasks.push({
		name: EditHistoryActions.ProcessModelChange, args: {
			...args,
			isDev: extras.context.isDevelopment
		}, return: undefinedFuture
	});
	await clear();
});
registerAction(EditHistoryActions.ProcessModelChangeMaybeUnordered, async (args, extras: ExtraContext) => {
	tasks.push({
		name: EditHistoryActions.ProcessModelChangeMaybeUnordered, args: {
			...args,
			isDev: extras.context.isDevelopment
		}, return: undefinedFuture
	});
	await clear();
});

registerAction(EditHistoryActions.InitModel, async (args: { relativePath: string, currentModelValue: string, realRelativePath?: string }, extras: ExtraContext) => {
	tasks.push({
		name: EditHistoryActions.InitModel, args: {
			...args,
			isDev: extras.context.isDevelopment
		}, return: undefinedFuture
	});
	await clear();
});

registerAction(EditHistoryActions.CompileGlobalDiffTrajectories, async (args, extras: ExtraContext) => {
	return cppEditHistoryDiffFormatter.compileGlobalDiffTrajectories(args.relativePathToDisplayName);
});

registerAction(EditHistoryActions.CompileGlobalDiffTrajectoriesForCmdk, async (args, extras: ExtraContext) => {
	if (extras.context.isDevelopment) {
		return cmdkEditHistoryDiffFormatter.compileGlobalDiffTrajectories(args.relativePathToDisplayName);
	} else {
		return cppEditHistoryDiffFormatter.compileGlobalDiffTrajectories(args.relativePathToDisplayName);
	}
});

registerAction(EditHistoryActions.CloseCurrentCmdkDiffHistoryPatch, async (args, extras: ExtraContext) => {
	if (extras.context.isDevelopment) {
		return cmdkEditHistoryDiffFormatter.closeCurrentPatch();
	} else {
		return cppEditHistoryDiffFormatter.closeCurrentPatch();
	}
});

registerAction(EditHistoryActions.IsRevertingToRecentModel, async (args, extras: ExtraContext) => {
	return cppEditHistoryDiffFormatter.isRevertingToRecentModel(args.relativePath, args.modelValue);
});

registerAction(EditHistoryActions.ProcessModelChangeLoop, async (args, extras: ExtraContext) => {
	return cppEditHistoryDiffFormatter.processModelChangesLoop();
});