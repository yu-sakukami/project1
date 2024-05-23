/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Anysphere Inc. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

// THIS IS A GENERATED FILE. DO NOT EDIT DIRECTLY.
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Anysphere Inc. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

// THIS IS A GENERATED FILE. DO NOT EDIT DIRECTLY.
/*

* Bridge File Created by Aman
* Do not add imports from this file unless you know what you are doing!

* TODO - figure out how to allow imports from vs/base, which can then feed into Cursor Extension Hooks!

*/
import { CodeResult, FileResult, RepositoryInfo, RepositoryStatusResponse } from 'proto/aiserver/v1/repository_pb';

import { MethodInfoUnary, PlainMessage } from 'external/bufbuild/protobuf';
import { ChatExternalLink, ChatQuote, CodeBlock, CommitNote, CursorPosition, ErrorDetails, File as ProtoFile } from 'proto/aiserver/v1/utils_pb';
import { CppFileDiffHistory } from 'proto/aiserver/v1/cpp_pb';
import { ShadowWorkspaceService } from 'proto/aiserver/v1/shadow_workspace_connectweb';
import { CheckQueuePositionResponse, DebugInfo, IsolatedTreesitterResponse } from 'proto/aiserver/v1/aiserver_pb';
import { Transport } from 'external/bufbuild/connect';

export enum SearchType {
	keyword = 'keyword',
	vector = 'vector',
}



/**
 * A provider result represents the values a provider
 * may return. For once this is the actual result type `T`, like `Hover`, or a thenable that resolves
 * to that type `T`. In addition, `null` and `undefined` can be returned - either directly or from a
 * thenable.
 *
 * The snippets below are all valid implementations of the HoverProvider:
 *
 * ```ts
 * let a: HoverProvider = {
 * 	provideHover(doc, pos, token): ProviderResult<Hover> {
 * 		return new Hover('Hello World');
 * 	}
 * }
 *
 * let b: HoverProvider = {
 * 	provideHover(doc, pos, token): ProviderResult<Hover> {
 * 		return new Promise(resolve => {
 * 			resolve(new Hover('Hello World'));
 * 	 	});
 * 	}
 * }
 *
 * let c: HoverProvider = {
 * 	provideHover(doc, pos, token): ProviderResult<Hover> {
 * 		return; // undefined
 * 	}
 * }
 * ```
 */
type Thenable<T> = PromiseLike<T>;
export type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>;



/////////////////////// TYPES USED IN EXTENSIONS ///////////////////////
/////////////////////// TYPES USED IN EXTENSIONS ///////////////////////
/////////////////////// TYPES USED IN EXTENSIONS ///////////////////////
/////////////////////// TYPES USED IN EXTENSIONS ///////////////////////

// main types for credentials
// main types for credentials
// main types for credentials
// main types for credentials

export type CursorCredentials = {
	websiteUrl: string;
	backendUrl: string;
	authClientId: string;
	authDomain: string;
	// No migration needed to add this field I believe
	repoBackendUrl: string;
	cppBackendUrl: string;
	credentialsDisplayName?: string;
};

// main types for git diffs/prs in chat
// main types for git diffs/prs in chat
// main types for git diffs/prs in chat
// main types for git diffs/prs in chat
// main types for git diffs/prs in chat
// main types for git diffs/prs in chat

export interface FullCommitAndDetails {
	files: File[];
	sha: string;
	message: string;
	date: string;
	author: string;
}

export interface File {
	chunks: Chunk[];
	deletions: number;
	additions: number;
	from?: string;
	to?: string;
	oldMode?: string;
	newMode?: string;
	index?: string[];
	deleted?: true;
	new?: true;
}

export interface Chunk {
	content: string;
	changes: Change[];
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
}

export interface NormalChange {
	type: 'normal';
	ln1: number;
	ln2: number;
	normal: true;
	content: string;
}

export interface AddChange {
	type: 'add';
	add: true;
	ln: number;
	content: string;
}

export interface DeleteChange {
	type: 'del';
	del: true;
	ln: number;
	content: string;
}

export type ChangeType = 'normal' | 'add' | 'del';

export type Change = NormalChange | AddChange | DeleteChange;


export interface PartialCommit {
	sha: string;
	message: string;
}
export interface PartialCommitLexicalAugmented extends PartialCommit {
	uuid: string;
}

export enum PRState {
	OPEN = 'open',
	CLOSED = 'closed',
	MERGED = 'merged',
}
export interface PartialPullRequest {
	id: number;
	number: number;
	title: string;
}

export interface PartialPullRequestLexicalAugmented extends PartialPullRequest {
	uuid: string;
}


export enum DiffType {
	TO_MAIN_FROM_BRANCH = 'to_main_from_branch',
	TO_HEAD = 'to_head',
}

export interface PartialDiff {
	type: DiffType;
	uuid: string;
}

export interface FullPullRequest extends PartialPullRequest {
	url: string;
	state: PRState;
	body: string;
	// comments: string[]
	diff: File[];
}

export enum DiffOrPrType {
	Diff = 'diff',
	Pr = 'pr',
}
export interface DiffOrPR extends PartialCommitLexicalAugmented {
	type: DiffOrPrType;
}

export interface FullCommit extends PartialCommit {
	description: string;
	author: string;
	date: string;
	diff: File[];
}

export type GetGitCommitContextResponse = {
	commits: {
		commit: string;
		author: string;
		date: string;
		message: string;
	}[];
};

// type PartialCommitProvider = () => Promise<PartialCommit[] | undefined>;
export type PartialCommitSearchProvider = (query: string) => Promise<PartialCommit[] | undefined>;
export type FullCommitProvider = (sha: string) => Promise<FullCommit | undefined>;
export type PartialPullRequestSearchProvider = (query: string) => Thenable<PartialPullRequest[] | undefined>;
export type FullPullRequestProvider = (pullRequestId: number) => Thenable<FullPullRequest | undefined>;
export type DiffProvider = () => Thenable<File[] | undefined>;
export type DiffProviderRaw = () => Thenable<string | undefined>;
export type DiffProviderMultipleFilesWithNums = (numCommits: number, startNumCommitsBeforeCurrent: number) => Thenable<(FullCommitWithoutFiles | undefined)[]>;
export type GitLineBlameProvider = (relativePath: string, line: number, numPreviousCommitsToGet: number) => Promise<GetGitCommitContextResponse | undefined>;
export type GitFileBlameProvider = (relativePath: string, numPreviousCommitsToGet: number) => Promise<GetGitCommitContextResponse | undefined>;
export type GitUpstreamURLProvider = () => Promise<string | undefined>;

export interface CursorGitContextProvider {
	getCommits: PartialCommitSearchProvider;
	getFullCommit: FullCommitProvider;
	getPullRequests: PartialPullRequestSearchProvider;
	getFullPullRequest: FullPullRequestProvider;
	getCurrentDiff: DiffProvider;
	getBranchDiff: DiffProvider;
	getDiffRaw: DiffProviderRaw;
	getLastCommit: DiffProvider;
	getGitLineBlame: GitLineBlameProvider;
	getGitUpstreamURL: GitUpstreamURLProvider;
	getGitFileBlame: GitFileBlameProvider;
	getLastCommits: DiffProviderMultipleFilesWithNums;
	getCommitRawByCommitHash: (commitHash: string, extraContext?: number) => Promise<string | undefined>;
	getFilenamesInCommit: (commitsAgo: number) => Promise<string[]>;
}

export interface CursorDevOnlyRedisStorageProvider {
	get(key: string): Promise<any | undefined>;
	set(key: string, value: any): Promise<void>;
}

export type ShowWebCmdKInputBoxArgs = {
	// location: reported as pixel values
	cursorX: number;
	cursorY: number;

	// for now we just send over the simple file link
	source: {
		fileName: string;
		lineNumber: number;
	};
}


// NOTE: any event you add here should be tolerant of having slightly incorrect times
// the events here also should not be tied to a specific model version
export type CppExtHostEvent =
	| {
		case: "gitContext",
		gitContext: {
			rootFsPath: string,
			relativeWorkspacePath: string,
		}
	};

export type ExtHostEventLogger = {
	recordExtHostEvent(event: SafeArgs<CppExtHostEvent>): Promise<void>;
	forceFlush(): Promise<void>;
}

export function enforceCppExtHostSafe(): SafeArgs<CppExtHostEvent> extends never // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY // GULPREMOVEBEFORECOMPILING
	? never // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY // GULPREMOVEBEFORECOMPILING
	: void { } // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY // GULPREMOVEBEFORECOMPILING

export type AiReaderMode = 'pseudocode' | 'graph'

export type AiReaderMessageToView =
	{
		type: 'pseudocode-yaml',
		value: {
			rawText: string;
			finished: boolean;
		}
	} |
	{
		type: 'set-context',
		value: {
			mode: AiReaderMode
			relativeWorkspacePath: string
		}
	};

export type AiReaderMessageToMain =
	{
		type: 'submit',
		value: {
			query: string
		}
	} |
	{
		type: 'open-file',
		value: {
			relativeWorkspacePath: string;
			selection?: ISelection
		}
	}

export type SemanticSearchQuery = {
	query: string,
	topK: number,
	finalK: number,
	options: {
		includePattern?: string;
		excludePattern?: string;
		contextCacheRequest?: boolean;
		globFilter?: string;
		// abortSignal?: AbortSignal;
	}
}

export type SemanticSearchResults = PlainMessage<CodeResult>[];

export interface AiReaderPseudoCodeBlock {
	id: string;
	pseudocode: string;
	selection: ISelection;
	children?: AiReaderPseudoCodeBlock[];
	importance: 'high' | 'medium' | 'low'
}

export type AiReaderGraphEdge = {
	from: string;
	to: string;
	description?: string;
};

export type AiReaderGraphNode = {
	id: string;
	type: 'method' | 'file';
	source: {
		fileName: string;
		selection?: ISelection;
	};
	description?: string;
};

export type AiReaderGraph = {
	nodes: AiReaderGraphNode[];
	edges: AiReaderGraphEdge[];
};

// main types for indexing provider
// main types for indexing provider
// main types for indexing provider
// main types for indexing provider
// main types for indexing provider
// main types for indexing provider


export enum UploadType {
	Upload = 'upload',
	Syncing = 'syncing',
}

/// these are mimicked in vscode/extensions/cursor-retrieval/src/types.ts
/// please update them there.
export type IndexingJob = {
	fileName: string;
};

export type IndexingStatus =
	| {
		case: 'loading'
	} | {
		case: 'indexing-setup'
	} | {
		case: 'indexing';
	} | {
		case: 'paused';
	} | {
		case: 'synced';
	} | {
		case: 'out-of-sync';
	} | {
		case: 'creating-index';
	} | {
		case: 'not-indexed';
	} | {
		case: 'error';
		error: string;
	} | {
		case: 'not-auto-indexing';
		numFiles: number;
	};

export type RepoInfo = Pick<PlainMessage<RepositoryInfo>, 'repoName' | 'repoOwner' | 'relativeWorkspacePath'>;
export type CursorAuthToken = string | undefined;
export type IndexProvider = {
	getStatus: () => Promise<IndexingStatus | undefined>;
	getCurrentJobs: () => Promise<IndexingJob[] | undefined>;
	getIndexingProgress: () => Promise<number | undefined>;

	// the high-level folder description is targeted to be around 1000 tokens.
	// we could tune that number later if we want to
	// it is computed for every repo during indexing and is pretty cheap to compute. it is cached for a week or so so it may be woefully out of date
	// if it is not computed yet then it is just undefined
	getHighLevelFolderDescription: () => Promise<string | undefined>;
};

export type RequesterProvider = {
	request: (methodName: string, input: any) => Promise<string>;
	flush: (uuid: string) => Promise<any[]>;
	cancel: (uuid: string) => void;
};

export type ConnectRequestProvider = Transport;

export type isNewRepositoryIndex = () => Promise<boolean | undefined>;


// main types for the metrics provider
// main types for the metrics provider
// main types for the metrics provider
// main types for the metrics provider
// main types for the metrics provider
// main types for the metrics provider
// main types for the metrics provider
// main types for the metrics provider

export type TagsMap = { [key: string]: string };
export type TagsArray = string[];
export type Tags = TagsMap | TagsArray;

export type IncrementStat = {
	stat: string,
	value?: number,
	tags?: Tags,
};

export type GaugeStat = {
	stat: string,
	value: number,
	tags?: Tags,
};

export type MetricsProvider = {
	increment: (stat: IncrementStat) => void;
	decrement: (stat: IncrementStat) => void;
	gauge: (stat: GaugeStat) => void;
	distribution: (stat: GaugeStat) => void;
};


// main types for the diffing provider
// main types for the diffing provider
// main types for the diffing provider
// main types for the diffing provider
// main types for the diffing provider

export type DiffObj = { value: string, added?: boolean, removed?: boolean };
export type DiffingProvider = {
	wordDiffForPartialCode: (oldCode: string, newCode: string) => Promise<{
		finalText: string
		changes: DiffObj[]
		fullLineChanges: DiffObj[]
	}>;
	wordDiff: (oldCode: string, newCode: string) => Promise<{
		changes: {
			value: string;
			added?: boolean;
			removed?: boolean;
		}[]
	}>;
}


// main types for the edithistory provider

export type DiffTrajectoryChunk = PlainMessage<CppFileDiffHistory>;
export interface EditHistoryProvider {
	initModel(m: {
		relativePath: string
	}): void;

	hasProcessedTextModelUptilVersion(currentVersion: number): ProviderResult<true | {
		versionProcessed: number;
	}>;

	compileGlobalDiffTrajectories(_relativePathToDisplayName?: { [relativePath: string]: string }): ProviderResult<DiffTrajectoryChunk[]>;
}

// main types for the lsp subgraph provider
// main types for the lsp subgraph provider
// main types for the lsp subgraph provider
// main types for the lsp subgraph provider
// main types for the lsp subgraph provider
// main types for the lsp subgraph provider

// TODO: current we are redefining the same types as vscode, ideally we should not have repetitive code
export interface LspSubgraphRange {
	startLine: number;
	startCharacter: number;
	endLine: number;
	endCharacter: number;
}

export enum LspSubgraphContextType {
	Hover = "Hover",
	Definition = "Definition",
	TypeDefinition = "TypeDefinition",
	Reference = "Reference",
	Implementation = "Implementation"
}

export interface LspSubgraphContextItem {
	uri?: string,
	type: LspSubgraphContextType,
	content: string,
	range?: LspSubgraphRange
}

export interface LspSubgraphFullContext {
	uri: string;
	symbolName: string;
	positions: {
		line: number,
		character: number,
	}[]
	contextItems: LspSubgraphContextItem[];
	score?: number;
}

export interface LspSubgraphBaseParams {
	mode: "CmdK" | "CPP"
}

export interface LspSubgraphCmdkParams extends LspSubgraphBaseParams {

}

export interface LspSubgraphCppParams extends LspSubgraphBaseParams {
	uri: string,
	curLine: number,
	lineText: string
}

export type LspSubgraphExtraParams = LspSubgraphCmdkParams | LspSubgraphCppParams

export type LspSubgraphProvider = {
	activate: () => void;
	deactivate: () => void;
	debouncedForceAbort: () => void;
	retrieve: (
		mode: string,
		uri: string,
		ranges: LspSubgraphRange[],
		extraParams: LspSubgraphExtraParams,
		extraKey?: string,
		timeout?: number
	) => Promise<LspSubgraphFullContext[] | undefined>;
}


/////////////////////// TYPES NOT USED IN EXTENSIONS ///////////////////////
/////////////////////// TYPES NOT USED IN EXTENSIONS ///////////////////////
/////////////////////// TYPES NOT USED IN EXTENSIONS ///////////////////////

/////////////////////// TYPES NOT USED IN EXTENSIONS ///////////////////////
/////////////////////// TYPES NOT USED IN EXTENSIONS ///////////////////////
/////////////////////// TYPES NOT USED IN EXTENSIONS ///////////////////////
/////////////////////// TYPES NOT USED IN EXTENSIONS ///////////////////////

export interface Doc {
	name: string;
	identifier: string;
	url?: string;
	isDifferentPrefixOrigin?: boolean;
}
export interface DocsState {
	visibleDocs: Doc[];
	usableDocs: Doc[];
}

export interface MultiEditChunk {
	text: string;
	fsPath: string;
	path: string;
	currentSelection: string;
	precedingCode: string[];
	suffixCode: string[];
	fileContents: string;
	startLineNumber: number;
	endLineNumber: number;
}


export interface RepositoryInformation {
	// Get the sync status directly from the repository service
	id: string;
	content: RepositoryStatusResponse;
}

export type DocSelection = {
	docId: string;
	name: string;
	uuid?: string;
	url?: string;
};

export type TextSearchSelection = {
	query: string;
	uuid?: string;

	files?: Promise<SearchFile[]>;
}

export type SearchFile = {
	relativePath: string;
	content: string;
}

export type ErrorSource = "chat" | "cmd-k" | "other";

export type ErrorTypeMetadata =
	((
		{
			case: 'internet';
			generationUUID: string;
			errorCode: number | undefined;
		} | {
			case: 'openai'
		}
		| { case: 'cursor_rate_limit' }
		| { case: 'openai_rate_limit' }
		| { case: 'gpt_4_vision_rate_limit' }
	) & {
		source: ErrorSource;
		error: ErrorDetails | undefined;
	})
	| { case: null; error: undefined; };

export type ChatAIGenerationMetadata = {
	type: 'chat';
	// the originating tab for the chat request
	tabId: string;
	// the originating bubble ID for the chat request
	bubbleId: string;
	// the bubble ID of the ai bubble that is being streamed into
	aiBubbleId?: string;
	// Whether or not we are using context
	useReranker?: boolean;
	// the type of the request
	chatType: 'chat' | 'toolformer' | 'intentChat' | 'context' | 'edit' | 'multiFileEdit' | 'followUp' | 'interpreter' | { case: 'interpreter'; retry?: boolean } | 'debugger';
	longContextModeEnabled?: boolean; // this is set to false for chatTypes besides chat, intentChat, followUp, and context
	intentDetermined?: boolean;
	summaryText?: string;
	summaryUpUntilIndex?: number;
	codeBlocks?: PlainMessage<CodeBlock>[];
	debugInfo?: PlainMessage<DebugInfo>;
	quotes?: PlainMessage<ChatQuote>[];
	externalLinks?: PlainMessage<ChatExternalLink>[];
	isBash?: boolean;
	// used by the client only, for client-side file filtering
	tokenLimit?: number;
	commitNotes?: { note: string, commitHash: string }[]
	isEval?: boolean;
};

export type CodeInterpreterAIGenerationMetadata = {
	type: 'codeInterpreter';
	tabId: string;
	bubbleId: string;
}


type FileWithoutContents = Omit<PlainMessage<ProtoFile>, 'contents'> & {
	contents?: never
};
type CodeBlockWithoutContents = Omit<PlainMessage<CodeBlock>, 'fileContents'> & {
	fileContents?: never
};
export type FileResultWithoutContents = Omit<PlainMessage<FileResult>, 'file'> & {
	file?: FileWithoutContents
}
export type CodeResultWithoutContents = Omit<PlainMessage<CodeResult>, 'codeBlock'> & {
	codeBlock?: CodeBlockWithoutContents
}


export type RepoWideContext = {
	fileResults?: FileResultWithoutContents[];
	codeResults?: CodeResultWithoutContents[];
};

// This stores all the metadata for a given chat bubble that the user
// either requests or is predicted by the AI

export type TaskGenerationMetadata = {
	type: 'task';
	// the originating task for the request
	taskId: string;
};


export type LineRange = {
	// 1-indexed
	startLineNumber: number;
	// 1-indexed and exclusive
	endLineNumberExclusive: number;
};

export type RSRange = {
	/**
	 * Line number on which the range starts (starts at 1).
	 */
	startLineNumber: number;
	/**
	 * Column on which the range starts in line `startLineNumber` (starts at 1).
	 */
	startColumn: number;
	/**
	 * Line number on which the range ends.
	 */
	endLineNumber: number;
	/**
	 * Column on which the range ends in line `endLineNumber`.
	 */
	endColumn: number;
};


export type RSPosition = {
	/**
	 * line number (starts at 1)
	 */
	readonly lineNumber: number;
	/**
	 * column (the first character in a line is between column 1 and column 2)
	 */
	readonly column: number;
}


export type RangeMapping = {
	originalRange: RSRange;
	modifiedRange: RSRange;
};

export type DiffModelChange = {
	removedTextLines: string[]; // can be empty if this is a pure addition. TODO: make this a string that has tokenization information, which we get from the original model
	removedLinesOriginalRange: LineRange; // the range in the original selected text representing the removed text. this is used to identify removed lines
	addedRange: LineRange; // the range relative to the start of the diff (1-indexed)
	relativeInnerChanges: RangeMapping[] | undefined; // the inner changes are relative to the removed text and added range
};


export type InterpreterExecutionMetadata = {
	type: 'interpreterExecution';
	tabId: string;
};

export type CmdKGenerationMetadata = {
	type: "cmdk"
}

export type InprogressAIGenerationMetadata =
	| ChatAIGenerationMetadata
	| TaskGenerationMetadata
	| CodeInterpreterAIGenerationMetadata
	| InterpreterExecutionMetadata
	| CmdKGenerationMetadata
	| { type: undefined };

export type InprogressAIGeneration = {
	generationUUID: string;
	metadata: InprogressAIGenerationMetadata;
	queuePositionResponse: CheckQueuePositionResponse | undefined; // slow queue 1-indexed or -1 if not in queue
}

export interface RepositoryMetadata {
	startedPolling: boolean;
}


/**
 * A selection in the editor.
 * The selection is a range that has an orientation.
 * These are 1-indexed.
 */
export interface ISelection {
	/**
	 * The line number on which the selection has started.
	 */
	readonly selectionStartLineNumber: number;
	/**
	 * The column on `selectionStartLineNumber` where the selection has started.
	 */
	readonly selectionStartColumn: number;
	/**
	 * The line number on which the selection has ended.
	 */
	readonly positionLineNumber: number;
	/**
	 * The column on `positionLineNumber` where the selection has ended.
	 */
	readonly positionColumn: number;
}


export enum LintResult {
	OK = 'OK',
	ERROR = 'ERROR',
	NO_CHANGES_FOUND = 'NO_CHANGES_FOUND',
	NONE = 'NONE',
}

export type AISettingsModelOption = string;

export type TAISettingsPrivateModelOption = {
	type: 'edit';
	modelName: string;
	displayName: string;
	promptType: string;
}

export type AISettings = {
	// 'null' means to use the default model
	openAIModel: AISettingsModelOption | null;
	longContextOpenAIModel: AISettingsModelOption | null;

	// 'null' means to use the default model
	privateFTOpenAIModel: TAISettingsPrivateModelOption | null;

	// enabled takes priority over disabled
	modelOverrideEnabled?: string[];
	modelOverrideDisabled?: string[];

	// if membership is enterprise, this will be set to the team IDs
	// unfortunately, this isn't a UUID, even though it probably should be
	// i am deliberately not storing the full team info here, since this is stored in user storage which means it is liable to migration problems
	teamIds?: number[];
};

export type NewUserData = {
	toolUsageCount: {
		plainChat: number | 'legacy';
		contextChat: number | 'legacy';
		intentChat: number | 'legacy';
	};
};

export interface authenticationSettings {
	// logged in to github through cursor for using the repo service?
	githubLoggedIn: boolean;
}


export type UserNudgeState = {
	ignored: boolean;
	timesShown: number;
	// date for reminding later, serialized to unix timestamp string
	remindLaterDate?: string;
};

export type AzureState = {
	useAzure: boolean;
	apiKey?: string;
	baseUrl?: string;
	deployment?: string;
};



export type AgentDebuggerState = {
	priomptLiveMode: boolean;
	engineId?: string;
	isRecordingTasks: boolean;
};

export type LinterDebuggerState = {
	specificRules: boolean;
	compileErrors: boolean;
	changeBehavior: boolean;
	matchCode: boolean;
	relevance: boolean;
	userAwareness: boolean;
};

export enum LocalRepoId {
	id = 'local'
}

export interface FilledRepositoryInfo {
	readonly id: string | LocalRepoId;
	readonly repoName: string;
	readonly repoOwner: string;
	readonly relativeWorkspacePath: string | undefined;
}

export interface OnboardingMetadata {
	shouldAskToIndex: boolean;
	shouldHideWarning: boolean;
}



// you may NEVER CHANGE this header
// it is hardcoded on the server
// please don't change
export const GHOST_MODE_HEADER_NAME = 'x-ghost-mode'; // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY

// be very very very careful about changing this function too!
// it, again, has a server dependency
export function ghostModeHeaderValue(ghostModeValue: boolean | undefined): string { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	if (ghostModeValue === true) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		return "true" // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} else if (ghostModeValue === false) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		return "false" // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} else if (ghostModeValue === undefined) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		return "implicit-false" // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} else { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		let _x: never = ghostModeValue;
		_x = _x;
		// just in case this happens, which it never should happen assuming no one does a ts-ignore or something, we return true
		return "true"; // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	}
}

// never change this function please
export function enhancedObfuscate(bytes: Uint8Array) {
	let lastByte = 0xA5; // Initial seed// EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = (bytes[i] ^ lastByte) + (i % 256); // XOR with lastByte and add index modulo 256 for obfuscation// EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		lastByte = bytes[i]; // Update lastByte to current for next iteration
	}// EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	return bytes;
}

export function getRequestHeadersExceptAccessToken({ req, machineId, base64Fn, cursorVersion, privacyMode, backupRequestId }: { req: any, machineId: string, base64Fn: (val: Uint8Array) => string, cursorVersion: string, privacyMode: boolean | undefined, backupRequestId?: string }) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	try { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		const unixKiloSeconds = Math.floor(Date.now() / 1_000_000); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		// we use 6 bytes here so that we get 8 base64 bytes exactly // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		const bytes = new Uint8Array([ // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			(unixKiloSeconds >> 40) & 0xFF, // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			(unixKiloSeconds >> 32) & 0xFF, // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			(unixKiloSeconds >> 24) & 0xFF, // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			(unixKiloSeconds >> 16) & 0xFF, // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			(unixKiloSeconds >> 8) & 0xFF, // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			unixKiloSeconds & 0xFF // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		]); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		const obfuscatedBytes = enhancedObfuscate(bytes); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		const checksum = base64Fn(obfuscatedBytes); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		req.header.set('x-cursor-checksum', `${checksum}${machineId}`); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} catch (e) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	// EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	// set the client version
	req.header.set('x-cursor-client-version', cursorVersion); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	// EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	req.header.set(GHOST_MODE_HEADER_NAME, ghostModeHeaderValue(privacyMode)); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	// EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	try { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		req.header.set('x-cursor-timezone', timezone); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} catch (e) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	// EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	try { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		if (backupRequestId) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			if (!req.header.has('x-request-id')) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
				req.header.set('x-request-id', backupRequestId); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			} // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			if (!req.header.has('x-amzn-trace-id')) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
				req.header.set("x-amzn-trace-id", `Root=${backupRequestId}`); // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
			} // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
		} // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} catch (e) { // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
	} // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY
} // EVERYSPHERE_MANUAL_REVIEW_REQUIRED_THIS_LINE_ONLY

///////////////////////////////////////////////////////////////////////////////
///// Types for the everythingProvider //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

export interface IRange {
	readonly startLineNumber: number;
	readonly startColumn: number;
	readonly endLineNumber: number;
	readonly endColumn: number;
}


export interface IModelContentChange {
	readonly range: IRange // 1 indexed, inclusive
	readonly text: string;
}

export type FullCommitWithoutFiles = Omit<FullCommitAndDetails, 'files'>;


// Checks if any value of the object is true
type AnyTrue<T> = true extends {
	[K in keyof T]: true extends T[K] ? true : never;
}[keyof T]
	? true
	: false;

// The BannedPattern is {case: string, value: any}. We dont want these as it implies
// an unserializable Protobuf (the oneof type)
type IsBannedPattern<T> = T extends ({ case: string, value: infer V } | { case: undefined; value?: undefined; }) ? true : false

// Converts T to true if it contains the banned pattern and false otherwise
type ContainsBannedPattern<T> = T extends object ?
	(T extends Array<infer U> ?
		AnyTrue<{ [K in keyof U]: ContainsBannedPattern<U> }> :
		(IsBannedPattern<T> extends true ? true : AnyTrue<{ [K in keyof T]: ContainsBannedPattern<T[K]> }>))
	: false;

// Sets objects with the banned pattern to never (which will show linter errors in registerAction)
type BanBannedPattern<T> = ContainsBannedPattern<T> extends true ? never : T;


export enum EditHistoryActions {
	Ack = 'editHistoryDiffFormatter.ack',
	GetModelValueInRanges = 'editHistoryDiffFormatter.getModelValueInRanges',
	GetModelValue = 'editHistoryDiffFormatter.getModelValue',
	ProcessManyModelChange = 'editHistoryDiffFormatter.processManyModelChange',
	ProcessModelChange = 'editHistoryDiffFormatter.processModelChange',
	ProcessModelChangeMaybeUnordered = 'editHistoryDiffFormatter.processModelChangeMaybeUnordered',
	CloseCurrentCmdkDiffHistoryPatch = 'editHistoryDiffFormatter.closeCurrentCmdkDiffHistoryPatch',
	InitModel = 'editHistoryDiffFormatter.initModel',
	CompileGlobalDiffTrajectories = 'editHistoryDiffFormatter.compileGlobalDiffTrajectories',
	CompileGlobalDiffTrajectoriesForCmdk = 'editHistoryDiffFormatter.compileGlobalDiffTrajectoriesForCmdk',
	IsRevertingToRecentModel = 'editHistoryDiffFormatter.isRevertingToRecentModel',
	ProcessModelChangeLoop = 'editHistoryDiffFormatter.processModelChangeLoop'
}

export enum CommitNotesServiceActions {
	GetCommitNotes = 'commitNotesService.getCommitNotes',
	SearchCommitNotes = 'commitNotesService.searchCommitNotes',
	InitializeNotes = 'commitNotesService.initialiezNotes'
}

export enum ContextGraphActions {
	TemporarilyRegisterFile = 'contextGraph.temporarilyRegisterFile',
	SemanticSearch = 'contextGraph.semanticSearch',
	GetSemanticSearchResults = 'contextGraph.getSemanticSearchResults',
	ProcessModelChanges = 'contextGraph.processModelChanges',
	ProcessBatchModelChanges = 'contextGraph.processBatchModelChanges',
	GetRelatedFiles = 'contextGraph.getRelatedFiles',
	SemanticSearchRelevantFilesToFiles = 'contextGraph.semanticSearchRelevantFilesToFiles',
	GetRelatedFilesToMultipleFiles = 'contextGraph.getRelatedFilesToMultipleFiles',
	SearchForRelatedFiles = 'contextGraph.searchForRelatedFiles',
	PopulateFromGit = 'contextGraph.populateFromGit',
	EnableTreesitter = 'contextGraph.enableTreesitter',
	InitializeGraph = 'contextGraph.initializeGraph'
}
export enum FileRetrievalActions {
	GetDirectory = 'fileRetrievalActions.readDirectory'
}
export enum MiscActions {
	CheckClaudeAPIKey = 'misc.checkClaudeAPIKey'
}
export enum TreeSitterActions {
	GetReferencedSymbols = 'treesitter.getReferencedSymbols',
	GetDefinedSymbols = 'treesitter.getDefinedSymbols',
	GetImportantDefinitionNames = 'treesitter.getImportantDefinitionNames'
}

export enum GitActions {
	GetRecentCommits = 'git.getRecentCommits',
	GetRecentCommitHashesTouchingFile = 'git.getRecentCommitHashesTouchingFile',
	GetCommitByHash = 'git.getCommitByHash',
	GetCommitDetailsByHashes = 'git.getCommitDetailsByHashes'
}

export enum LspActions {
	GetFileImports = 'lsp.getFileImports'
}

export enum DevOnlyRedisActions {
	Get = 'devOnlyRedis.get',
	Set = 'devOnlyRedis.set',
	SubscribeToChannelForKey = 'devOnlyRedis.subscribeToChannelForKey',
	UnsubscribeFromChannelForKey = 'devOnlyRedis.unsubscribeFromChannelForKey'
}
export enum DevOnlyRedisComands {
	ValueChanged = 'devOnlyRedis.valueChanged'
}
export type RedisValueChangeEvent = {
	key: string
}

export type SimplestLineRange = { startLineNumber: number, endLineNumberExclusive: number };

export type MergeBehavior =
	{ type: 'single line' }
	| { type: 'include if in radius', radius?: number }
	| { type: 'include if in radius with upper limit', radius: number, limit: number }
	| { type: 'merged diff history', radius: number }

export type ModelChangeArgs = { uniqueModelIdentifier: string, realRelativePath?: string, newModelValue: string, deletedRangeInOldModelOneIndexed: SimplestLineRange, addedRangeInNewModelOneIndexed: SimplestLineRange, displayName?: string, mergingBehavior?: MergeBehavior, change?: IModelContentChange, timestamp?: number, isDev?: boolean }
export type MultiModelChangeArgs = { uniqueModelIdentifier: string, realRelativePath?: string, newModelValue: string, displayName?: string, mergingBehavior?: MergeBehavior, changes: IModelContentChange[], timestamp?: number, isDev?: boolean }
export interface FileRange {
	startPosition: PlainMessage<CursorPosition>,
	endPosition: PlainMessage<CursorPosition>,
}
export type PlainFileRange = { startPosition: PlainMessage<CursorPosition>, endPosition: PlainMessage<CursorPosition> }
export type TurboPufferReturnResults = { direct: { content: string, score: number, range: FileRange, relativePath: string }[], turbopuffer: { content: string, score: number, range: PlainFileRange, relativePath: string }[] } | undefined

type SafePromise<T> = Promise<BanBannedPattern<T>>
export type SafeArgs<T> = BanBannedPattern<T>

// You must use a SafePromise for the return and a SafeArgs for the args
// This will cause linter errors to pop up when you use unserializable types that are not transmittable through the proxy
export type EditHistoryActionType =
	| { name: EditHistoryActions.Ack; args: SafeArgs<null>; return: SafePromise<boolean> }
	| { name: EditHistoryActions.GetModelValueInRanges; args: SafeArgs<{ relativePath: string; ranges: IRange[] }>; return: SafePromise<string[] | undefined> }
	| { name: EditHistoryActions.GetModelValue; args: SafeArgs<{ relativePath: string }>; return: SafePromise<string | undefined> }
	| { name: EditHistoryActions.ProcessManyModelChange; args: SafeArgs<MultiModelChangeArgs>; return: SafePromise<void> }
	| { name: EditHistoryActions.ProcessModelChange; args: SafeArgs<ModelChangeArgs>; return: SafePromise<void> }
	| { name: EditHistoryActions.ProcessModelChangeMaybeUnordered; args: SafeArgs<MultiModelChangeArgs>; return: SafePromise<void> }
	| { name: EditHistoryActions.CloseCurrentCmdkDiffHistoryPatch; args: SafeArgs<null>; return: SafePromise<void> }
	| { name: EditHistoryActions.InitModel; args: SafeArgs<{ relativePath: string; currentModelValue: string; realRelativePath?: string, isDev?: boolean }>; return: SafePromise<void> }
	| { name: EditHistoryActions.CompileGlobalDiffTrajectories; args: SafeArgs<{ relativePathToDisplayName?: { [relativePath: string]: string } }>; return: SafePromise<PlainMessage<CppFileDiffHistory>[]> }
	| { name: EditHistoryActions.CompileGlobalDiffTrajectoriesForCmdk; args: SafeArgs<{ relativePathToDisplayName?: { [relativePath: string]: string } }>; return: SafePromise<PlainMessage<CppFileDiffHistory>[]> }
	| { name: EditHistoryActions.IsRevertingToRecentModel; args: SafeArgs<{ relativePath: string; modelValue: string }>; return: SafePromise<boolean> }
	| { name: EditHistoryActions.ProcessModelChangeLoop; args: SafeArgs<null>; return: SafePromise<void> }


// We do not need to use SafeArgs here because we do binary serialization for sending over the extension host!
export type ShadowClient = {
	[P in keyof (typeof ShadowWorkspaceService)["methods"]]:
	(typeof ShadowWorkspaceService)["methods"][P] extends MethodInfoUnary<infer I, infer O> ? (req: I) => Promise<O> : never
}

export type DevOnlyRedisActionsType =
	| { name: DevOnlyRedisActions.Get, args: SafeArgs<{ key: string }>, return: SafePromise<any | undefined> }
	| { name: DevOnlyRedisActions.Set, args: SafeArgs<{ key: string, value: string }>, return: SafePromise<void> }
	| { name: DevOnlyRedisActions.SubscribeToChannelForKey, args: SafeArgs<{ key: string, channel: string }>, return: SafePromise<boolean> }
	| { name: DevOnlyRedisActions.UnsubscribeFromChannelForKey, args: SafeArgs<{ key: string, channel: string }>, return: SafePromise<true> }

// You must use a SafePromise for the return and a SafeArgs for the args
export type ContextGraphActionType =
	| { name: ContextGraphActions.TemporarilyRegisterFile; args: SafeArgs<{ relativePath: string; content: string }>; return: SafePromise<void> }
	| { name: ContextGraphActions.SemanticSearch; args: SafeArgs<{ query: string; files: { relativePath: string; weight?: number }[]; topK?: number }>; return: SafePromise<string> }
	| { name: ContextGraphActions.GetSemanticSearchResults; args: SafeArgs<{ id: string }>; return: SafePromise<TurboPufferReturnResults> }
	| { name: ContextGraphActions.ProcessModelChanges; args: SafeArgs<{ workspaceId: string; relativePath: string; numChanges: number }>; return: SafePromise<void> }
	| { name: ContextGraphActions.ProcessBatchModelChanges; args: SafeArgs<{ changes: { workspaceId: string; relativePath: string; numChanges: number }[] }>; return: SafePromise<void> }
	| { name: ContextGraphActions.GetRelatedFiles; args: SafeArgs<{ workspaceId: string; relativePath: string }>; return: SafePromise<{ relativePath: string; weight: number; }[]> }
	| { name: ContextGraphActions.SemanticSearchRelevantFilesToFiles; args: SafeArgs<{ workspaceId: string; query: string; files: { relativePath: string; weight?: number }[] }>; return: SafePromise<{ content: string; score: number; range: FileRange; relativePath: string; }[]> }
	| { name: ContextGraphActions.GetRelatedFilesToMultipleFiles; args: SafeArgs<{ workspaceId: string; files: { relativePath: string; weight?: number | undefined }[]; topK?: number }>; return: SafePromise<{ relativePath: string; weight: number; }[]> }
	| { name: ContextGraphActions.SearchForRelatedFiles; args: SafeArgs<{ workspaceId: string; query: string; files: { relativePath: string; weight?: number, }[]; topK?: number }>; return: SafePromise<{ relativePath: string; weight: number; }[]> }
	| { name: ContextGraphActions.PopulateFromGit; args: SafeArgs<{ workspaceId: string }>; return: SafePromise<void> }
	| { name: ContextGraphActions.EnableTreesitter; args: SafeArgs<null>; return: SafePromise<boolean> }
	| { name: ContextGraphActions.InitializeGraph; args: SafeArgs<{ workspaceId: string }>; return: SafePromise<void> }

export type CommitNotesServiceActionType =
	| { name: CommitNotesServiceActions.GetCommitNotes; args: SafeArgs<{ workspaceId: string }>; return: SafePromise<CommitNote[] | undefined> }
	| { name: CommitNotesServiceActions.SearchCommitNotes; args: SafeArgs<{ workspaceId: string; query: string; topK?: number }>; return: SafePromise<CommitNote[] | undefined> }
	| { name: CommitNotesServiceActions.InitializeNotes; args: SafeArgs<{ workspaceId: string }>; return: SafePromise<void> }

// You must use a SafePromise for the return and a SafeArgs for the args
export type FileRetrievalActionType = { name: FileRetrievalActions.GetDirectory; args: SafeArgs<{ fsPath: string }>; return: SafePromise<string[] | null> }

// You must use a SafePromise for the return and a SafeArgs for the args
export type TreeSitterActionType =
	| { name: TreeSitterActions.GetReferencedSymbols, args: SafeArgs<{ fileContent: string, languageId: string }>, return: SafePromise<PlainMessage<IsolatedTreesitterResponse> | undefined> }
	| { name: TreeSitterActions.GetDefinedSymbols, args: SafeArgs<{ fileContent: string, languageId: string }>, return: SafePromise<PlainMessage<IsolatedTreesitterResponse> | undefined> }
	| { name: TreeSitterActions.GetImportantDefinitionNames, args: SafeArgs<{ fileContent: string, languageId: string }>, return: SafePromise<PlainMessage<IsolatedTreesitterResponse> | undefined> }

export type MiscActionType = { name: MiscActions.CheckClaudeAPIKey, args: SafeArgs<{ apiKey: string }>, return: SafePromise<{ valid: boolean, error?: string }> }

export type GitActionType =
	| { name: GitActions.GetRecentCommits, args: SafeArgs<{ numCommits: number }>, return: SafePromise<FullCommitAndDetails[]> }
	| { name: GitActions.GetRecentCommitHashesTouchingFile, args: SafeArgs<{ relativePath: string, numCommits: number }>, return: SafePromise<string[]> }
	| { name: GitActions.GetCommitByHash, args: SafeArgs<{ hash: string }>, return: SafePromise<FullCommitAndDetails | undefined> }
	| { name: GitActions.GetCommitDetailsByHashes, args: SafeArgs<{ hashes: string[] }>, return: SafePromise<FullCommitWithoutFiles[]> }

export type LspActionType = { name: LspActions.GetFileImports, args: SafeArgs<{ filePath: string }>, return: SafePromise<string[]> }

// You must use a SafePromise for the return and a SafeArgs for the args

export type EverythingProviderArgs = (
	| ContextGraphActionType
	| FileRetrievalActionType
	| TreeSitterActionType
	| CommitNotesServiceActionType
	| GitActionType
	| MiscActionType
	| LspActionType
	| DevOnlyRedisActionsType
)

export type EverythingProviderAllLocalArgs = (
	| EditHistoryActionType
)

// The purpose of the SafePromise and SafeArgs is to ensure that users never insert an args or return type with non-invertible serialization for EverythingProviderArgs.
// Right now, these are protobufs with the oneof field. In typescript, this turns into a union of {case: 'string', value: T} types.
// It will specifically create an error when calling `registerAction` as it will cast the inappropriate
// arg/return type into never
export type EverythingProvider = {
	runCommand: <K extends EverythingProviderArgs['name']>(
		commandName: K,
		args: ExtractArgs<K>
	) => ExtractReturn<K> | Promise<undefined>
}

export type EverythingProviderAllLocal = {
	runCommand: <K extends EverythingProviderAllLocalArgs['name']>(
		commandName: K,
		args: ExtractEverythingProviderAllLocalArgs<K>
	) => ExtractEverythingProviderAllLocalReturn<K> | Promise<undefined>
}

export type ExtractArgs<T extends EverythingProviderArgs['name']> = Extract<EverythingProviderArgs, { name: T }>['args'];
export type ExtractEverythingProviderAllLocalArgs<T extends EverythingProviderAllLocalArgs['name']> = Extract<EverythingProviderAllLocalArgs, { name: T }>['args'];

export type ExtractReturn<T extends EverythingProviderArgs['name']> = Extract<EverythingProviderArgs, { name: T }>['return'];
export type ExtractEverythingProviderAllLocalReturn<T extends EverythingProviderAllLocalArgs['name']> = Extract<EverythingProviderAllLocalArgs, { name: T }>['return'];

export enum CppSource {
	Unknown = "unknown",
	LineChange = "line_change",
	Typing = "typing",
	OptionHold = "option_hold",
	LinterErrors = "lint_errors",
	ParameterHints = "parameter_hints",
	CursorPrediction = "cursor_prediction"
}
