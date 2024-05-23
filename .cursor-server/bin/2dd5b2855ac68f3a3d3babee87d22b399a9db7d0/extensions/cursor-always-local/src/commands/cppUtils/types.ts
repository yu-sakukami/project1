export type ModelWindow = {
	lines: string[];
	// 1-indexed, inclusive
	startLineNumber: number;
	// 1-indexed, inclusive
	endLineNumber: number;
}


// The reason these are duplicated from reactiveStorageTypes is because
// when this code is copied to the backend, we don't copy reactiveStorageTypes
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