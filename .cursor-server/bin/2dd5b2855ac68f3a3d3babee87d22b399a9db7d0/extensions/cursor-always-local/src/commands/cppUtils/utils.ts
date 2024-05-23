import { CppFileDiffHistory } from '../../proto/aiserver/v1/cpp_pb';
import { diffLines } from './diff/line';
import { IModelContentChange, ModelWindow } from './types';
import { OverlapBehaviour, Range } from './mergedDiffUtils/range';
import { diffWords } from './diff/word';

type ModelChangeArgs = {
	uniqueModelIdentifier: string,
	realRelativePath?: string,
	newModelValue: string,
	deletedRangeInOldModelOneIndexed: SimplestLineRange,
	addedRangeInNewModelOneIndexed: SimplestLineRange,
	displayName?: string,
	mergingBehavior?: MergeBehavior,
	change?: Partial<IModelContentChange> & Pick<IModelContentChange, 'range' | 'text'>,
	timestamp?: number,
}

export type FullModelChangeArgs = ModelChangeArgs & { callback?: () => void }

export type DiffOptions = {
	ignoreWhitespace?: boolean;
	newlineIsToken?: boolean;
	comparator?: (a: string, b: string) => boolean;
	ignoreCase?: boolean;
	maxEditLength?: number;
	callback?: ((a: string, b: any[]) => void);
	singleLineChanges?: boolean;
}

export type DiffObj = { value: string, added?: boolean, removed?: boolean };

export interface SimpleDiffProvider {
	diffLines: (newText: string, oldText: string, words?: boolean, options?: Omit<DiffOptions, 'callback'>) => Promise<DiffObj[]>;
	diffWords: (newText: string, oldText: string, options?: Omit<DiffOptions, 'callback'>) => Promise<DiffObj[]>;
}

export type SimplestLineRange = { startLineNumber: number, endLineNumberExclusive: number };

export type MergeBehavior =
	{ type: 'single line' }
	| { type: 'include if in radius', radius?: number }
	| { type: 'include if in radius with upper limit', radius: number, limit: number }
	| { type: 'merged diff history', radius: number }

type EditHistoryDiffState = {

	// The current "active diff" -- model changes may be merged into this
	newModel: string, // the current state of the model
	oldestModel: string, // the state of the model at the start of the active diff
	addedRangeInNewModelOneIndexed?: SimplestLineRange, // the range in the new model that was created by this diff
	cachedPatchString?: string, // latest patch string for this active diff, should be set to undefined when the latest model changes

	lastEditTime?: number,

	diffHistory: {
		lastEditTime: number,
		patchString: string
	}[] // previous diffs, each is stored as a patch string
};

export class DefaultDiffProvider implements SimpleDiffProvider {

	async diffLines(newText: string, oldText: string, words?: boolean | undefined, options?: DiffOptions): Promise<DiffObj[]> {
		const modifiedOptions = { ...options }
		delete modifiedOptions.singleLineChanges
		const changes: DiffObj[] = diffLines(oldText, newText, modifiedOptions);
		// console.log('[Changes]', changes)

		if (options?.singleLineChanges) {
			const singleLineChanges = changes.map(change => {
				const splitChange = change.value.split('\n');
				const mappedChanges = splitChange.map((changeValue, index) => {
					if (index < splitChange.length - 1) {
						return [{ value: changeValue, added: change.added, removed: change.removed }, { value: '\n', added: change.added, removed: change.removed }];
					} else {
						return { value: changeValue, added: change.added, removed: change.removed };
					}
				});
				return mappedChanges.flat();
			}).flat().filter(change => change.value !== '');
			return singleLineChanges;
		}

		return changes;
	}

	async diffWords(newText: string, oldText: string, options?: Omit<DiffOptions, 'callback'>): Promise<DiffObj[]> {
		const modifiedOptions = { ...options }
		delete modifiedOptions.singleLineChanges
		const changes: DiffObj[] = diffWords(oldText, newText, modifiedOptions);

		if (options?.singleLineChanges) {
			const singleLineChanges = changes.map(change => {
				const splitChange = change.value.split(' ');
				const mappedChanges = splitChange.map((changeValue, index) => {
					if (index < splitChange.length - 1) {
						return [{ value: changeValue, added: change.added, removed: change.removed }, { value: ' ', added: change.added, removed: change.removed }];
					} else {
						return { value: changeValue, added: change.added, removed: change.removed };
					}
				});
				return mappedChanges.flat();
			}).flat().filter(change => change.value !== '');
			return singleLineChanges;
		}

		return changes;
	}
}

export interface IRange {
	readonly startLineNumber: number;
	readonly startColumn: number;
	readonly endLineNumber: number;
	readonly endColumn: number;
}

export class EditHistoryFormatter {
	// different for training: michael had it at 90, 40
	private diffHistorySizeLimit = 90;
	private patchStringSizeLimit = 40;
	private recentModelHashesByIdentifier: { [uniqueModelIdentifier: string]: string[] } = {}

	private previousCompiledGlobalDiffTrajectories: CppFileDiffHistory[] = []
	private latestCompiledGlobalDiffTrajectoriesVersion: number | undefined = undefined
	private version: number | undefined = undefined

	private gitDiffExtraContextRadius;

	private _diffStateByUniqueModelIdentifier: {
		[modelIdentifier: string]: EditHistoryDiffState
	} = {};

	private latestRangeByModelIdentifier: { [modelIdentifier: string]: Range } = {};

	// This is a hack to address a train/inference mismatch
	// Where our training script was not compiling the diff history with the latest change
	// This should be turned off for all models trained after ~Dec 2
	numModelChangesToSave?: number;
	constructor({ numModelChangesToSave, diffHistorySizeLimit, patchStringSizeLimit, gitDiffExtraContextRadius }: { numModelChangesToSave?: number, diffHistorySizeLimit?: number, patchStringSizeLimit?: number, gitDiffExtraContextRadius?: number }) {
		this.numModelChangesToSave = numModelChangesToSave;
		this.diffHistorySizeLimit = diffHistorySizeLimit ?? this.diffHistorySizeLimit;
		this.patchStringSizeLimit = patchStringSizeLimit ?? this.patchStringSizeLimit;

		this.gitDiffExtraContextRadius = gitDiffExtraContextRadius ?? 0;
	}

	private diffingProvider?: SimpleDiffProvider;
	setDiffingProvider(diffingProvider: SimpleDiffProvider) {
		this.diffingProvider = diffingProvider;
	}

	initModel(modelIdentifier: string, currentModelValue: string, realRelativePath?: string) {
		this.recentModelHashesByIdentifier[modelIdentifier] ??= []
		this.recentModelHashesByIdentifier[modelIdentifier].push(cppModelHash(currentModelValue, 1))
		this.recentModelHashesByIdentifier[modelIdentifier] = this.recentModelHashesByIdentifier[modelIdentifier].slice(-10)

		this._diffStateByUniqueModelIdentifier[modelIdentifier] = {
			oldestModel: currentModelValue,
			newModel: currentModelValue,
			diffHistory: []
		};
	}

	getModelValue(modelIdentifier: string): string | undefined {
		return this._diffStateByUniqueModelIdentifier[modelIdentifier]?.newModel;
	}

	badPatchString(patchString: string) {
		return patchString.trim() !== '' && patchString.split('\n').length < this.patchStringSizeLimit
	}

	closeCurrentPatch() {
		this._diffStateByUniqueModelIdentifier['<close-patch>'] = {
			oldestModel: '',
			newModel: '',
			diffHistory: [],
			lastEditTime: Date.now()
		};
	}

	// Returns a list of patch strings representing the users recent changes in the editor
	// Filters out diffs that are especially long
	async compileGlobalDiffTrajectories(_modelIdentifierToDisplayName?: { [modelIdentifier: string]: string }) {
		if (this.version !== undefined && this.latestCompiledGlobalDiffTrajectoriesVersion === this.version) {
			return this.previousCompiledGlobalDiffTrajectories
		}

		const modelIdentifierToDisplayName = _modelIdentifierToDisplayName ?? {};
		let globalDiffTrajectories: { lastEditTime: number, patchString: string, modelIdentifier: string }[] = [];
		for (const modelIdentifier in this._diffStateByUniqueModelIdentifier) {
			const diffTrajectories = this._diffStateByUniqueModelIdentifier[modelIdentifier].diffHistory;
			globalDiffTrajectories = globalDiffTrajectories.concat(diffTrajectories.map(t => {
				return { ...t, modelIdentifier }
			}));


			// Conver the active diff into a patch string
			const latestModelDiffRange = this._diffStateByUniqueModelIdentifier[modelIdentifier].addedRangeInNewModelOneIndexed;
			const lastEditTime = this._diffStateByUniqueModelIdentifier[modelIdentifier].lastEditTime;
			if (latestModelDiffRange !== undefined && lastEditTime !== undefined) {
				try {
					const value = await this.getPatchStringOfActiveDiff(modelIdentifier);

					globalDiffTrajectories.push({
						modelIdentifier: modelIdentifier,
						lastEditTime: lastEditTime!,
						patchString: value
					});
				} catch (e) { // This was historically to handle timeout errors in the differ
					this.updateOldestModel(modelIdentifier, this._diffStateByUniqueModelIdentifier[modelIdentifier].newModel);
					console.log('Cpp timeout', e);
				}
			}
		}

		globalDiffTrajectories.sort((a, b) => a.lastEditTime - b.lastEditTime);
		globalDiffTrajectories = globalDiffTrajectories.filter(obj => this.badPatchString(obj.patchString));
		globalDiffTrajectories = globalDiffTrajectories.slice(-this.diffHistorySizeLimit);

		const allDiffsWithFileNames = globalDiffTrajectories.map((obj, index) => {
			return new CppFileDiffHistory({
				fileName: modelIdentifierToDisplayName[obj.modelIdentifier] ?? obj.modelIdentifier,
				diffHistory: [obj.patchString]
			});
		});


		// Then we reduce to a list of
		const finalGlobalDiffTrajectories = allDiffsWithFileNames.reduce((fileList, currentFileDiff): CppFileDiffHistory[] => {
			if (fileList.length === 0) {
				return [currentFileDiff];
			}

			const lastFileDiff = fileList[fileList.length - 1];
			if (lastFileDiff.fileName === currentFileDiff.fileName) {
				lastFileDiff.diffHistory.push(...currentFileDiff.diffHistory);
			} else {
				fileList.push(currentFileDiff);
			}
			return fileList;
		}, [] as CppFileDiffHistory[])

		this.latestCompiledGlobalDiffTrajectoriesVersion = this.version
		this.previousCompiledGlobalDiffTrajectories = finalGlobalDiffTrajectories

		return finalGlobalDiffTrajectories
	}

	isRevertingToRecentModel(modelIdentifier: string, modelValue: string) {
		return this.recentModelHashesByIdentifier[modelIdentifier]?.includes(cppModelHash(modelValue, 1)) ?? false
	}

	processModelChangeLoopRunning: boolean = false
	changesToProcessArgs: FullModelChangeArgs[] = []
	async processModelChangesLoop() {
		if (this.processModelChangeLoopRunning) {
			return
		}
		this.processModelChangeLoopRunning = true
		while (this.changesToProcessArgs.length > 0) {
			const args = this.changesToProcessArgs.shift()
			if (args === undefined) {
				break
			}

			const { uniqueModelIdentifier, newModelValue, addedRangeInNewModelOneIndexed, deletedRangeInOldModelOneIndexed, mergingBehavior } = args;
			if (this._diffStateByUniqueModelIdentifier[uniqueModelIdentifier] === undefined) {
				this.initModel(uniqueModelIdentifier, newModelValue);
				return;
			}

			const { addedRangeInNewModelOneIndexed: previousAddedRangeInNewModelOneIndexed, newModel, lastEditTime } = this._diffStateByUniqueModelIdentifier[uniqueModelIdentifier];
			// Start tracking a new diff if none exist
			if (previousAddedRangeInNewModelOneIndexed === undefined || lastEditTime === undefined) {
				this._diffStateByUniqueModelIdentifier[uniqueModelIdentifier].addedRangeInNewModelOneIndexed = addedRangeInNewModelOneIndexed;
			} else {
				const rangesIntersect = (range1: SimplestLineRange, range2: SimplestLineRange) => {
					return range1.startLineNumber <= range2.endLineNumberExclusive && range1.endLineNumberExclusive >= range2.startLineNumber;
				}
				const shouldMerge = (oldRange: SimplestLineRange, newRange: SimplestLineRange) => {
					if (mergingBehavior === undefined || mergingBehavior.type === 'single line') {
						// Uncomment this if you'd like to do tests where you check that everything in the diff history occured in one of the real moddels
						// return (newRange.endLineNumberExclusive === oldRange.endLineNumberExclusive && newRange.startLineNumber === oldRange.startLineNumber);

						// This was used to compile the training data
						return (newRange.endLineNumberExclusive - newRange.startLineNumber <= 1 && oldRange.startLineNumber === newRange.endLineNumberExclusive) || (oldRange.endLineNumberExclusive === newRange.endLineNumberExclusive && oldRange.startLineNumber === newRange.startLineNumber);
					} else if (mergingBehavior.type === 'merged diff history') {
						const currentPatchRange = this.latestRangeByModelIdentifier[uniqueModelIdentifier] ?? new Range(oldRange.startLineNumber, 0, oldRange.endLineNumberExclusive - 1, 10000);
						const realNewRange = new Range(newRange.startLineNumber, 0, newRange.endLineNumberExclusive - 1, 10000);

						const overlap = Range.getRangeExpandedByLines(currentPatchRange, mergingBehavior.radius, mergingBehavior.radius).getOverlap(realNewRange);

						if (overlap !== OverlapBehaviour.None) {
							const finalRange = Range.merge(currentPatchRange, realNewRange);
							this.latestRangeByModelIdentifier[uniqueModelIdentifier] = finalRange;
							return true
						} else {
							this.latestRangeByModelIdentifier[uniqueModelIdentifier] = realNewRange;
							return false
						}
					} else {
						const doIntersect = rangesIntersect(oldRange, newRange);
						const distanceFromOldToNew = Math.min(Math.abs(oldRange.startLineNumber - newRange.startLineNumber), Math.abs(oldRange.endLineNumberExclusive - newRange.endLineNumberExclusive), Math.abs(oldRange.startLineNumber - newRange.endLineNumberExclusive), Math.abs(oldRange.endLineNumberExclusive - newRange.startLineNumber));
						const intersectsWithRadius = doIntersect || distanceFromOldToNew <= mergingBehavior.radius!;
						if (mergingBehavior.type === 'include if in radius with upper limit') {
							const oldSize = Math.max(oldRange.endLineNumberExclusive, newRange.endLineNumberExclusive) - Math.min(oldRange.startLineNumber, newRange.startLineNumber);
							const newSize = newRange.endLineNumberExclusive - newRange.startLineNumber;
							return intersectsWithRadius && (oldSize === newSize || oldSize <= mergingBehavior.limit);
						} else {
							return intersectsWithRadius;
						}
					}
				}

				const shouldMergeValue = shouldMerge(previousAddedRangeInNewModelOneIndexed, deletedRangeInOldModelOneIndexed)

				if (!shouldMergeValue || this.newestModelIdentifier() !== uniqueModelIdentifier) {
					// We cannot merge into the active diff, so we convert it to a patch string and start a new one
					try {
						this._diffStateByUniqueModelIdentifier[uniqueModelIdentifier].diffHistory.push({ patchString: await this.getPatchStringOfActiveDiff(uniqueModelIdentifier), lastEditTime });
						this.cleanDiffTrajectories();
					} catch (e) {
						console.log('Cpp timeout', e);
					}
					this.updateOldestModel(uniqueModelIdentifier, newModel);
					this._diffStateByUniqueModelIdentifier[uniqueModelIdentifier].addedRangeInNewModelOneIndexed = addedRangeInNewModelOneIndexed;
				} else {
					// We merge our change into the active diff
					let { startLineNumber: newStartLine, endLineNumberExclusive: newEndLine } = applyChangeToRange(previousAddedRangeInNewModelOneIndexed, deletedRangeInOldModelOneIndexed, addedRangeInNewModelOneIndexed);

					this._diffStateByUniqueModelIdentifier[uniqueModelIdentifier].addedRangeInNewModelOneIndexed = {
						startLineNumber: newStartLine,
						endLineNumberExclusive: newEndLine
					}
				}
			}
			this._diffStateByUniqueModelIdentifier[uniqueModelIdentifier].lastEditTime = Date.now();
			this.updateNewModel(uniqueModelIdentifier, newModelValue);

			if (args.callback) {
				args.callback()
			}
		}

		this.processModelChangeLoopRunning = false
	}

	lock = false;
	async acquireLock() {
		if (this.lock) {
			while (this.lock) {
				await new Promise(resolve => setTimeout(resolve, 10));
			}
		}
		this.lock = true
	}

	releaseLock() {
		this.lock = false
	}

	// Updates the diff history given a model change
	// The model change is represented by old model value, new model value
	// We also accept the deleted range in the old model and the inserted range in the new model
	// This is used to decide whether we should merge the change into the current diff
	async processModelChange(args: FullModelChangeArgs) {
		this.changesToProcessArgs.push(args)
		this.recentModelHashesByIdentifier[args.uniqueModelIdentifier] ??= []
		this.recentModelHashesByIdentifier[args.uniqueModelIdentifier].push(cppModelHash(args.newModelValue, 1))
		this.recentModelHashesByIdentifier[args.uniqueModelIdentifier] = this.recentModelHashesByIdentifier[args.uniqueModelIdentifier].slice(-15)
		await this.processModelChangesLoop()
	}

	private removeOldestDiffTrajectory() {
		let oldestTime = Infinity;
		let oldestModelIdentifier: string | null = null;

		// Find the relativePath with the oldest edit time
		for (const modelIdentifier in this._diffStateByUniqueModelIdentifier) {
			const diffTrajectories = this._diffStateByUniqueModelIdentifier[modelIdentifier].diffHistory;
			if (diffTrajectories.length > 0) {
				const oldestEditTime = diffTrajectories[0].lastEditTime;
				if (oldestEditTime < oldestTime) {
					oldestTime = oldestEditTime;
					oldestModelIdentifier = modelIdentifier;
				}
			}
		}

		// Remove the oldest diff trajectory
		if (oldestModelIdentifier !== null) {
			this._diffStateByUniqueModelIdentifier[oldestModelIdentifier].diffHistory.shift();
		}
	}

	isEmptyHistory() {
		for (const modelIdentifier in this._diffStateByUniqueModelIdentifier) {
			if (this._diffStateByUniqueModelIdentifier[modelIdentifier].diffHistory.length > 0) {
				return false;
			}
		}
		return true;
	}

	private cleanDiffTrajectories() {
		let totalTrajectories = 0;
		for (const modelIdentifier in this._diffStateByUniqueModelIdentifier) {
			this._diffStateByUniqueModelIdentifier[modelIdentifier].diffHistory = this._diffStateByUniqueModelIdentifier[modelIdentifier].diffHistory.filter(obj => this.badPatchString(obj.patchString));
			totalTrajectories += this._diffStateByUniqueModelIdentifier[modelIdentifier].diffHistory.length;
		}
		for (let a = totalTrajectories; a > this.diffHistorySizeLimit; a--) {
			this.removeOldestDiffTrajectory();
		}
	}

	// Convert the active diff into a patch string
	// Uses cached value if possible
	private async getPatchStringOfActiveDiff(modelIdentifier: string) {
		const { oldestModel, newModel, cachedPatchString } = this._diffStateByUniqueModelIdentifier[modelIdentifier];
		if (cachedPatchString !== undefined) {
			return cachedPatchString;
		}
		const diffString = await computePatchString({ past: oldestModel, current: newModel, radius: this.gitDiffExtraContextRadius, diffingProvider: this.diffingProvider, ignoreWhitespaceChanges: true });
		this._diffStateByUniqueModelIdentifier[modelIdentifier].cachedPatchString = diffString;
		return diffString;
	}

	private newestModelIdentifier() {
		let newestModelIdentifier = null;
		let newestTime = -Infinity;
		for (const modelIdentifier in this._diffStateByUniqueModelIdentifier) {
			const lastEditTime = this._diffStateByUniqueModelIdentifier[modelIdentifier].lastEditTime;
			if (lastEditTime !== undefined && lastEditTime > newestTime) {
				newestModelIdentifier = modelIdentifier;
				newestTime = lastEditTime;
			}
		}
		return newestModelIdentifier;
	}

	// These setters exist to make sure we invalidate the cache
	private updateNewModel(modelIdentifier: string, latestModel: string,) {
		this._diffStateByUniqueModelIdentifier[modelIdentifier].newModel = latestModel;
		delete this._diffStateByUniqueModelIdentifier[modelIdentifier].cachedPatchString;
	}
	private updateOldestModel(modelIdentifier: string, oldestModel: string) {
		this._diffStateByUniqueModelIdentifier[modelIdentifier].oldestModel = oldestModel;
		delete this._diffStateByUniqueModelIdentifier[modelIdentifier].cachedPatchString;
	}
}

export function changeModelLinesInPlace(lines: string[], change: IModelContentChange, options?: { noNeedToMakeSureLinesAreLines?: boolean }) {
	try {
		const { range, text } = change;

		const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
		const startLine = lines[startLineNumber - 1];
		const beforeStart = startLine.substring(0, startColumn - 1);
		const afterEnd = endColumn === 1 ? lines[endLineNumber - 1] ?? '' : lines[endLineNumber - 1].substring(endColumn - 1);

		if (options?.noNeedToMakeSureLinesAreLines === true) {
			lines.splice(startLineNumber - 1, endLineNumber - startLineNumber + 1, beforeStart + text + afterEnd);
		} else {
			lines.splice(startLineNumber - 1, endLineNumber - startLineNumber + 1, ...(beforeStart + text + afterEnd).split("\n"));
		}
	} catch (e) {
		console.log('Cpp error', change, e);
		throw e;
	}
}

export function changeModel(model: string, change: IModelContentChange): string {
	const lines = model.split('\n');
	changeModelLinesInPlace(lines, change, { noNeedToMakeSureLinesAreLines: true });
	return lines.join('\n');
}

const CURSOR_HASH_PREFIX = 'cursorhashversionC7wtBsDmlFaPg4ToTvIlm'; // no files should start with this
export function getCppModelHashVersion(hash: string) {
	if (hash.startsWith(CURSOR_HASH_PREFIX)) {
		const split = hash.split(':')
		if (split[0] !== CURSOR_HASH_PREFIX) {
			throw new Error('Unexpected hash version split')
		}
		return parseInt(split[1], 10)
	}
	return 0
}

// When changing this function bump the default version, update the function above,
// and make sure it supports previous versions.
export function cppModelHash(s: string, version: number = 1): string {
	// Legacy model hash didn't annotate its version and always did stringHash(s)
	if (version === undefined || version === 0) {
		return `${stringHash(s, 0)}`
	} else if (version === 1) {
		const versionPrefix = `${CURSOR_HASH_PREFIX}:1:`
		// To avoid repeated hashing which is expensive on every model change (in datagen)
		// we only hash when the model is quite large, to limit memory usage.
		if (s.length > 10_000) {
			return `${versionPrefix}${stringHash(s, 0)}`;
		}
		return `${versionPrefix}${s}`
	} else {
		throw new Error('Unsupported hash version')
	}
}

export function stringHash(s: string, hashVal: number) {
	hashVal = numberHash(149417, hashVal);
	for (let i = 0, length = s.length; i < length; i++) {
		hashVal = numberHash(s.charCodeAt(i), hashVal);
	}
	return hashVal;
}

export function numberHash(val: number, initialHashVal: number): number {
	return (((initialHashVal << 5) - initialHashVal) + val) | 0;  // hashVal * 31 + ch, keep as int32
}

export function getOldLineRange(change: IModelContentChange): SimplestLineRange {
	return {
		startLineNumber: change.range.startLineNumber,
		endLineNumberExclusive: change.range.endLineNumber + 1,
	}
}

export function getNewLineRange(change: IModelContentChange): SimplestLineRange {
	return {
		startLineNumber: change.range.startLineNumber,
		endLineNumberExclusive: change.range.startLineNumber + change.text.split('\n').length,
	}
}

export function getValueInRange(model: string, range: SimplestLineRange) {
	return model.split('\n').slice(range.startLineNumber - 1, range.endLineNumberExclusive - 1).join('\n');
}

export function applyChangeToArbitraryRange(rangeInOldModelToTrack: SimplestLineRange, deletedRangeInOldModelOneIndexed: SimplestLineRange, addedRangeInNewModelOneIndexed: SimplestLineRange) {

	const computeDeltaAboveLine = (lineNum: number) => {
		if (lineNum > deletedRangeInOldModelOneIndexed.startLineNumber) {
			if (lineNum > deletedRangeInOldModelOneIndexed.endLineNumberExclusive) {
				return addedRangeInNewModelOneIndexed.endLineNumberExclusive - deletedRangeInOldModelOneIndexed.endLineNumberExclusive;
			} else {
				// deletes it to the startLine, then stretches it to the new endline
				return addedRangeInNewModelOneIndexed.endLineNumberExclusive - lineNum;
			}
		}
		return 0
	}
	const newStartLine = rangeInOldModelToTrack.startLineNumber + computeDeltaAboveLine(rangeInOldModelToTrack.startLineNumber);
	const newEndLine = rangeInOldModelToTrack.endLineNumberExclusive + computeDeltaAboveLine(rangeInOldModelToTrack.endLineNumberExclusive);
	return {
		startLineNumber: newStartLine,
		endLineNumberExclusive: newEndLine
	}
}

export function applyChangeToRange(rangeInOldModelToTrack: SimplestLineRange, deletedRangeInOldModelOneIndexed: SimplestLineRange, addedRangeInNewModelOneIndexed: SimplestLineRange) {
	const computeDeltaAboveLine = (lineNum: number) => {
		if (lineNum > deletedRangeInOldModelOneIndexed.startLineNumber) {
			if (lineNum > deletedRangeInOldModelOneIndexed.endLineNumberExclusive) {
				return addedRangeInNewModelOneIndexed.endLineNumberExclusive - deletedRangeInOldModelOneIndexed.endLineNumberExclusive;
			} else {
				// deletes it to the startLine, then stretches it to the new endline
				return addedRangeInNewModelOneIndexed.endLineNumberExclusive - lineNum;
			}
		}
		return 0
	}

	const newStartLine = Math.min(addedRangeInNewModelOneIndexed.startLineNumber, rangeInOldModelToTrack.startLineNumber + computeDeltaAboveLine(rangeInOldModelToTrack.startLineNumber));
	const newEndLine = Math.max(addedRangeInNewModelOneIndexed.endLineNumberExclusive, rangeInOldModelToTrack.endLineNumberExclusive + computeDeltaAboveLine(rangeInOldModelToTrack.endLineNumberExclusive));
	return {
		startLineNumber: newStartLine,
		endLineNumberExclusive: newEndLine
	}
}

export function getExpandedRangeOneIndexed(modelValue: string, startRangeOneIndexed: SimplestLineRange, radius: number, aboveRadius?: number) {
	const lines = modelValue.split('\n');
	const midpoint = Math.floor((startRangeOneIndexed.startLineNumber + startRangeOneIndexed.endLineNumberExclusive) / 2);
	const diffRangeExpandedOneIndexed = {
		startLineNumber: Math.max(1, midpoint - (aboveRadius ?? radius)),
		endLineNumberExclusive: Math.min(lines.length + 1, midpoint + radius + 1)
		// If we want to let people option hold on a range, though note that this is used in the training data generation
		// startLineNumber: Math.min(startRange.startLineNumber, Math.max(1, midpoint - (aboveRadius ?? radius))),
		// endLineNumberExclusive: Math.max(startRange.endLineNumberExclusive, Math.min(lines.length, midpoint + radius + 1))
	}

	while (diffRangeExpandedOneIndexed.startLineNumber < diffRangeExpandedOneIndexed.endLineNumberExclusive && lines[diffRangeExpandedOneIndexed.startLineNumber - 1].trim() === '' && diffRangeExpandedOneIndexed.startLineNumber > 1) {
		diffRangeExpandedOneIndexed.startLineNumber += 1;
	}
	while (diffRangeExpandedOneIndexed.startLineNumber < diffRangeExpandedOneIndexed.endLineNumberExclusive && lines[diffRangeExpandedOneIndexed.endLineNumberExclusive - 2].trim() === '' && diffRangeExpandedOneIndexed.endLineNumberExclusive - 2 < lines.length) {
		diffRangeExpandedOneIndexed.endLineNumberExclusive -= 1;
	}

	return diffRangeExpandedOneIndexed;
}

export function getGreensAndRedsRangesFromChanges(diffObjs: readonly DiffObj[], decorationRange: IRange, model: 'pre-change' | 'post-change'): { greenRanges: IRange[], redRanges: IRange[] } {
	const greenRanges: IRange[] = [];
	let additionsAboveCurrentTopLine = "";
	let foundChangesOnTop = false;
	for (const obj of diffObjs) {
		if (obj.added) {
			foundChangesOnTop = true;
			additionsAboveCurrentTopLine += obj.value;
		} else if (!obj.removed) {
			break;
		}
	}

	const extraLinesOnTop = foundChangesOnTop ? additionsAboveCurrentTopLine.split('\n').length : 0;
	let line = 1;
	let col = 1;

	for (const obj of diffObjs) {
		const lines = obj.value.split('\n');
		const newLine = line + lines.length - 1;
		const newCol = lines.length > 1 ? lines[lines.length - 1].length + 1 : col + obj.value.length;
		if (obj.added === true) {
			const range = {
				startLineNumber: line,
				startColumn: col,
				endLineNumber: newLine,
				endColumn: newCol
			}
			greenRanges.push({
				startLineNumber: range.startLineNumber + decorationRange.startLineNumber - 1 - (model === 'pre-change' ? extraLinesOnTop : 0),
				startColumn: range.startColumn,
				endLineNumber: range.endLineNumber + decorationRange.startLineNumber - 1 - (model === 'pre-change' ? extraLinesOnTop : 0),
				endColumn: range.endColumn
			});
			col = newCol
			line = newLine
		}
		if (obj.removed !== true) {
			col = newCol;
			line = newLine;
		}
	}

	return { greenRanges, redRanges: [] };
}

// NAVIDTODO: Bug is here. Fix it
export async function computeDeletedAddedRanges({ past, current, diffingProvider }: { past: string, current: string, diffingProvider?: SimpleDiffProvider }): Promise<{ oldRange: SimplestLineRange, newRange: SimplestLineRange } | undefined> {
	const lineDiffs = await new Promise<any[]>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error('Timeout exceeded'));
		}, 2000); // Set your desired timeout in milliseconds
		if (diffingProvider !== undefined) {
			diffingProvider.diffLines(current, past, undefined, undefined).then(changes => resolve(changes))
		} else {
			diffLines(past, current, (_: any, lineDiffs: any[]) => {
				clearTimeout(timeout);
				resolve(lineDiffs);
			})
		}
	});

	let minChangedLineNumber = Infinity;
	let maxChangedLineNumber = -Infinity;
	let maxChangedWithWhitespace = -Infinity;
	let currentLineNumber = 1;

	lineDiffs.forEach((change, index) => {
		if (change.added === true || change.removed === true) {
			minChangedLineNumber = Math.min(minChangedLineNumber, currentLineNumber);
			if (change.value.trim() !== '') {
				maxChangedLineNumber = Math.max(maxChangedLineNumber, currentLineNumber + change.count - 1);
			}
			maxChangedWithWhitespace = Math.max(maxChangedWithWhitespace, currentLineNumber + change.count - 1);
		}
		currentLineNumber += change.count;
	});

	minChangedLineNumber = Math.max(0, minChangedLineNumber);
	if (maxChangedLineNumber === -Infinity) {
		maxChangedLineNumber = maxChangedWithWhitespace;
	}
	maxChangedLineNumber = maxChangedLineNumber;

	// Slow
	let oldLineNum = minChangedLineNumber - 1;
	let newLineNum = minChangedLineNumber - 1;
	let minAdded = Infinity;
	let maxAdded = -Infinity;
	let minRemoved = Infinity;
	let maxRemoved = -Infinity;

	for (let lineNumber = minChangedLineNumber; lineNumber <= maxChangedLineNumber; lineNumber++) {
		currentLineNumber = 1;
		const change = lineDiffs.find((change, index) => {
			const nextLineNumber = currentLineNumber + change.count;
			const found = currentLineNumber <= lineNumber && lineNumber < nextLineNumber;
			currentLineNumber = nextLineNumber;
			return found;
		});

		if (change !== undefined) {
			if (change.added === true) {
				newLineNum++;
				minAdded = Math.min(minAdded, newLineNum);
				maxAdded = Math.max(maxAdded, newLineNum);
			} else if (change.removed === true) {
				oldLineNum++;
				minRemoved = Math.min(minRemoved, oldLineNum);
				maxRemoved = Math.max(maxRemoved, oldLineNum);
			} else {
				oldLineNum++;
				newLineNum++;
			}
		}
	}

	if (minAdded === Infinity && minRemoved === Infinity) {
		return undefined;
	}

	if (minAdded === Infinity) {
		minAdded = minRemoved;
		maxAdded = minRemoved;
	}

	if (minRemoved === Infinity) {
		minRemoved = minAdded;
		maxRemoved = maxAdded;
	}

	return { oldRange: { startLineNumber: minRemoved, endLineNumberExclusive: maxRemoved + 1 }, newRange: { startLineNumber: minAdded, endLineNumberExclusive: maxAdded + 1 } };
}

export async function computePatchString({ past, current, radius, diffingProvider, ignoreWhitespaceChanges }: { past: string, current: string, radius: number, diffingProvider?: SimpleDiffProvider, ignoreWhitespaceChanges?: boolean }): Promise<string> {
	const lineDiffs = await new Promise<any[]>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error('Timeout exceeded'));
		}, 2000); // Set your desired timeout in milliseconds
		if (diffingProvider !== undefined) {
			diffingProvider.diffLines(current, past, undefined, undefined).then(changes => resolve(changes))
		} else {
			diffLines(past, current, (_: any, lineDiffs: any[]) => {
				clearTimeout(timeout);
				resolve(lineDiffs);
			})
		}
	});

	let minChangedLineNumber = Infinity;
	let maxChangedLineNumber = -Infinity;
	let maxChangedWithWhitespace = -Infinity;
	let currentLineNumber = 1;

	lineDiffs.forEach((change, index) => {
		if (change.added === true || change.removed === true) {
			minChangedLineNumber = Math.min(minChangedLineNumber, currentLineNumber);
			if (change.value.trim() !== '') {
				maxChangedLineNumber = Math.max(maxChangedLineNumber, currentLineNumber + change.count - 1);
			}
			maxChangedWithWhitespace = Math.max(maxChangedWithWhitespace, currentLineNumber + change.count - 1);
		}
		currentLineNumber += change.count;
	});

	minChangedLineNumber = Math.max(0, minChangedLineNumber - radius);
	if (maxChangedLineNumber === -Infinity) {
		maxChangedLineNumber = maxChangedWithWhitespace;
	}
	maxChangedLineNumber = maxChangedLineNumber + radius;

	if (minChangedLineNumber === Infinity || maxChangedLineNumber === -Infinity) {
		return '';
	}

	// Warrents further investigation
	const pastNoWhitespace = past.replace(/\s/g, '');
	const currentNoWhitespace = current.replace(/\s/g, '');
	if (ignoreWhitespaceChanges === true && pastNoWhitespace === currentNoWhitespace) {
		return '';
	}

	let output = '';

	// Slow
	let oldLineNum = minChangedLineNumber - 1;
	let newLineNum = minChangedLineNumber - 1;
	for (let lineNumber = minChangedLineNumber; lineNumber <= maxChangedLineNumber; lineNumber++) {
		currentLineNumber = 1;
		const change = lineDiffs.find((change, index) => {
			const nextLineNumber = currentLineNumber + change.count;
			const found = currentLineNumber <= lineNumber && lineNumber < nextLineNumber;
			currentLineNumber = nextLineNumber;
			return found;
		});

		if (change !== undefined) {
			const lineOffset = lineNumber - (currentLineNumber - change.count);
			if (change.added === true) {
				newLineNum++;
				output += `${newLineNum.toString().padStart(0, ' ')}+|` + change.value.split('\n')[lineOffset] + '\n';
			} else if (change.removed === true) {
				oldLineNum++;
				output += `${oldLineNum.toString().padStart(0, ' ')}-|` + change.value.split('\n')[lineOffset] + '\n';
			} else {
				oldLineNum++;
				newLineNum++;
				output += `${newLineNum.toString().padStart(0, ' ')} |` + change.value.split('\n')[lineOffset] + '\n';
			}
		}
	}

	return output;
}

// TODO: this can almost certainly be sped up....
// in particular, we probably don't need to do close to as many copies as we're doing here
export function changeModelWindowInPlace(modelWindow: ModelWindow, change: IModelContentChange) {
	if (change.range.startLineNumber < modelWindow.startLineNumber) {
		throw new Error("change is not contained in model window");
	}
	if (change.range.endLineNumber > modelWindow.endLineNumber && !(change.range.endLineNumber === modelWindow.endLineNumber + 1 && change.range.endColumn === 1 && change.text.endsWith("\n"))) {
		throw new Error("change is not contained in model window");
	}

	changeModelLinesInPlace(modelWindow.lines, {
		range: {
			startLineNumber: change.range.startLineNumber - modelWindow.startLineNumber + 1,
			startColumn: change.range.startColumn,
			endLineNumber: change.range.endLineNumber - modelWindow.startLineNumber + 1,
			endColumn: change.range.endColumn
		},
		text: change.text
	});

	modelWindow.endLineNumber = modelWindow.startLineNumber + modelWindow.lines.length - 1;
}

export function changeModelWindowInPlaceAndComputeUndoChange(modelWindow: ModelWindow, change: IModelContentChange): IModelContentChange {
	if (change.range.startLineNumber < modelWindow.startLineNumber) {
		throw new Error("change is not contained in model window");
	}
	if (change.range.endLineNumber > modelWindow.endLineNumber && !(change.range.endLineNumber === modelWindow.endLineNumber + 1 && change.range.endColumn === 1 && change.text.endsWith("\n"))) {
		throw new Error("change is not contained in model window");
	}

	const undoChange = {
		range: rangeForUndoChange(change),
		text: getValueInRangeLines(modelWindow.lines, {
			startLineNumber: change.range.startLineNumber - modelWindow.startLineNumber + 1,
			startColumn: change.range.startColumn,
			endLineNumber: change.range.endLineNumber - modelWindow.startLineNumber + 1,
			endColumn: change.range.endColumn
		}),
	};

	changeModelWindowInPlace(modelWindow, change);

	return undoChange;
}

export function getValueInRangeLines(lines: string[], range: IRange): string {
	let result = '';
	for (let i = range.startLineNumber - 1; i < range.endLineNumber; i++) {
		if (i === range.endLineNumber - 1 && range.endColumn === 1) {
			break;
		}
		const startColumn = i === range.startLineNumber - 1 ? range.startColumn - 1 : 0;
		const endColumn = i === range.endLineNumber - 1 ? range.endColumn - 1 : lines[i].length;
		result += lines[i].substring(startColumn, endColumn);
		if (i < range.endLineNumber - 1) {
			result += '\n';
		}
	}
	return result;
}

export function areChangesEqual(a: IModelContentChange, b: IModelContentChange): boolean {
	return a.range.startLineNumber === b.range.startLineNumber &&
		a.range.startColumn === b.range.startColumn &&
		a.range.endLineNumber === b.range.endLineNumber &&
		a.range.endColumn === b.range.endColumn &&
		a.text === b.text;
}

export function isRangeEmpty(r: IRange): boolean {
	return r.startLineNumber === r.endLineNumber && r.startColumn === r.endColumn;
}

export function rangeForUndoChange(change: IModelContentChange): IRange {
	return {
		startLineNumber: change.range.startLineNumber,
		startColumn: change.range.startColumn,
		endLineNumber: change.range.startLineNumber + change.text.split('\n').length - 1,
		endColumn: change.text.lastIndexOf('\n') === -1 ? change.range.startColumn + change.text.length : change.text.length - change.text.lastIndexOf('\n')
	}
}