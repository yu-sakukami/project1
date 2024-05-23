import { CurrentFileInfo } from '../../../proto/aiserver/v1/utils_pb';
import { Position, Range } from './range';
import { Change } from './change';

export default class ModelSnapshot {
	relativePath: string;
	content: string;
	hash: string | undefined;
	selection: Range | undefined;
	cursorPosition: Position | undefined;

	constructor(relativePath: string, content: string, hash?: string) {
		this.relativePath = relativePath;
		this.content = content;
		this.hash = hash;
	}

	public getLines() {
		return this.content.split('\n');
	}

	public numberOfLines() {
		return this.getLines().length;
	}

	private updateContent(lines: string[]) {
		this.content = lines.join('\n');
	}

	applyChange(change: Change) {
		let lines = this.getLines();
		let startLine = change.range.start.lineNumber;
		let endLine = change.range.end.lineNumber;
		if (startLine < 0) {
			startLine = 0;
		}
		if (endLine < 0) {
			endLine = 0;
		}
		if (startLine > lines.length - 1) {
			startLine = lines.length - 1;
		}
		if (endLine > lines.length - 1) {
			endLine = lines.length - 1;
		}
		try {
			const beforeStart = lines[startLine].slice(0, change.range.start.column);
			// const afterEnd = endLine === lines.length ? [] : lines[endLine].slice(change.range.end.column);
			const afterEnd = lines[endLine].slice(change.range.end.column); // TODO: NAVID - IS THIS + 1 OR NOT

			lines.splice(startLine, endLine - startLine + 1, beforeStart + change.text + afterEnd)
			this.updateContent(lines)
		} catch (e) {
			console.log(e)
			throw (e)
		}

	}

	setCursorPositionAndSelectionFromOutgoingChange(change: Change) {
		this.cursorPosition = change.range.start;
		this.selection = change.range;
	}

	static withCursorAndSelection(model: ModelSnapshot, cursorPosition: Position, selection: Range) {
		const newModel = new ModelSnapshot(model.relativePath, model.content);
		newModel.setCursorPosition(cursorPosition);
		newModel.setSelection(selection);
		return newModel;
	}

	setCursorPosition(position: Position) {
		this.cursorPosition = position;
	}

	setSelection(selection: Range) {
		this.selection = selection;
	}

	static applyChange(model: ModelSnapshot, change: Change) {
		const newModel = new ModelSnapshot(model.relativePath, model.content);
		newModel.applyChange(change);
		// console.log('[Applied Change On Model Snapshot - New Num Lines]', newModel.numberOfLines())
		return newModel;
	}

	diff(otherModel: ModelSnapshot): Change[] {
		const lines = this.getLines();
		const otherLines = otherModel.getLines();
		let changes: Change[] = [];

		// TODO: Run diff algorithm here

		return changes;
	}

	getTextInRange(range: Range) {
		const lines = this.getLines();
		let text = "";
		// console.log("[Getting Text In Range]\n", this.content)
		// console.log("[Range]", range)
		// console.log('[Lines]', lines.length)
		for (let i = range.start.lineNumber; i <= range.end.lineNumber; i++) {
			if (i === lines.length && i === range.end.lineNumber && range.end.column === 0) {
				break;
			}
			const line = lines[i];
			if (i === range.start.lineNumber) {
				text += line.slice(range.start.column);
			} else if (i === range.end.lineNumber) {
				text += line.slice(0, range.end.column);
			} else {
				text += line;
			}
			if (i !== range.end.lineNumber) {
				text += '\n';
			}
		}
		return text;
	}

	getTextInLines(startLine: number, endLine: number) {
		const lines = this.getLines();
		return lines.slice(startLine, endLine + 1).join('\n');
	}

	getRangeBetweenLines(startLine: number, endLineInclusive: number) {
		const lines = this.getLines();
		const start = new Position(startLine, 0);
		if (endLineInclusive >= startLine) {
			const end = new Position(endLineInclusive, lines[endLineInclusive].length);
			return new Range(start, end);
		} else {
			const end = new Position(endLineInclusive + 1, 0);
			return new Range(start, end);
		}
	}

	asCurrentFileInfo(): CurrentFileInfo {
		return new CurrentFileInfo({
			relativeWorkspacePath: this.relativePath,
			contents: this.content,
			cursorPosition: this.cursorPosition ? {
				line: this.cursorPosition?.lineNumber,
				column: this.cursorPosition?.column,
			} : undefined,
			selection: this.selection ? {
				startPosition: {
					line: this.selection.start.lineNumber,
					column: this.selection.start.column,
				},
				endPosition: {
					line: this.selection.end.lineNumber,
					column: this.selection.end.column,
				},
			} : undefined,
		})
	}

	static getNumCommonLinesAtBeginningOfSnapshots(modelSnapshot1: ModelSnapshot, modelSnapshot2: ModelSnapshot) {
		const lines1 = modelSnapshot1.getLines(); // TODO: NAVID - LOOK INTO THIS Why do we use -1 on the bottom but not in the while loop
		const lines2 = modelSnapshot2.getLines();
		let numCommonLines = 0;
		while (numCommonLines < lines1.length && numCommonLines < lines2.length && lines1[numCommonLines] === lines2[numCommonLines]) {
			numCommonLines++;
		}

		if (numCommonLines > 0 && (lines1[numCommonLines - 1] === undefined || lines2[numCommonLines - 1] === undefined || lines1[numCommonLines - 1] !== lines2[numCommonLines - 1])) {
			numCommonLines--
		}

		return numCommonLines;
	}

	static getNumCommonLinesAtEndOfSnapshots(modelSnapshot1: ModelSnapshot, modelSnapshot2: ModelSnapshot) {
		const linesReversed1 = modelSnapshot1.getLines().reverse();
		const linesReversed2 = modelSnapshot2.getLines().reverse();
		let numCommonLines = 0;
		while (numCommonLines < linesReversed1.length && numCommonLines < linesReversed2.length && linesReversed1[numCommonLines] === linesReversed2[numCommonLines]) {
			numCommonLines++;
		}

		if (numCommonLines > 0 && (linesReversed1[numCommonLines - 1] === undefined || linesReversed2[numCommonLines - 1] === undefined || linesReversed1[numCommonLines - 1] !== linesReversed2[numCommonLines - 1])) {
			numCommonLines--
		}

		return numCommonLines;
	}

	static getSemiAccurateChangeBetweenModelSnapshots(modelSnapshot1: ModelSnapshot, modelSnapshot2: ModelSnapshot) {
		const numCommonLinesAtBeginning = this.getNumCommonLinesAtBeginningOfSnapshots(modelSnapshot1, modelSnapshot2);
		const numCommonLinesAtEnd = this.getNumCommonLinesAtEndOfSnapshots(modelSnapshot1, modelSnapshot2);

		return {
			content1: modelSnapshot1.getTextInLines(numCommonLinesAtBeginning, modelSnapshot1.numberOfLines() - numCommonLinesAtEnd - 1),
			content2: modelSnapshot2.getTextInLines(numCommonLinesAtBeginning, modelSnapshot2.numberOfLines() - numCommonLinesAtEnd - 1),
			content1Extended: modelSnapshot1.getTextInLines(Math.max(numCommonLinesAtBeginning - 5, 0), Math.min(modelSnapshot1.numberOfLines() - numCommonLinesAtEnd - 1 + 5, modelSnapshot1.numberOfLines() - 1)),
			content2Extended: modelSnapshot2.getTextInLines(Math.max(numCommonLinesAtBeginning - 5, 0), Math.min(modelSnapshot2.numberOfLines() - numCommonLinesAtEnd - 1 + 5, modelSnapshot2.numberOfLines() - 1)),
			numCommonLinesAtBeginning,
			numCommonLinesAtEnd,
		}
	}

	static getCommonPrefixAndSuffix(modelSnapshot1: ModelSnapshot, modelSnapshot2: ModelSnapshot) {
		const numCommonLinesAtBeginning = this.getNumCommonLinesAtBeginningOfSnapshots(modelSnapshot1, modelSnapshot2);
		const numCommonLinesAtEnd = this.getNumCommonLinesAtEndOfSnapshots(modelSnapshot1, modelSnapshot2);
		return {
			prefix: modelSnapshot1.getTextInLines(0, numCommonLinesAtBeginning - 1),
			suffix: modelSnapshot1.getTextInLines(modelSnapshot1.numberOfLines() - numCommonLinesAtEnd, modelSnapshot1.numberOfLines() - 1),
			changedInitialText: modelSnapshot1.getTextInLines(numCommonLinesAtBeginning, modelSnapshot1.numberOfLines() - numCommonLinesAtEnd - 1),
			changedFinalText: modelSnapshot2.getTextInLines(numCommonLinesAtBeginning, modelSnapshot2.numberOfLines() - numCommonLinesAtEnd - 1),
		}
	}
}
