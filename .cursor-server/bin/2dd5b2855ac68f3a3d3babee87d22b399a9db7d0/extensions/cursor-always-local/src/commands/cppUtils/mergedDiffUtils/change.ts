import { Position, Range } from './range';

export class Change {
	text: string;
	range: Range;
	finalModelRange: Range | undefined;
	finalModelHash?: string;
	relativePath: string;
	timestamp: Date;

	constructor(text: string, range: Range, relativePath: string, timestamp: Date, finalModelHash?: string, finalModelRange?: Range) {
		this.text = text;
		this.range = range;
		this.finalModelHash = finalModelHash;
		this.relativePath = relativePath;
		this.timestamp = timestamp;
		this.finalModelRange = finalModelRange;
	}

	turnToZeroIndexed() {
		this.range.start.lineNumber -= 1;
		this.range.start.column -= 1;
		this.range.end.lineNumber -= 1;
		this.range.end.column -= 1;
	}

	// static getChangeBetweenModelSnapshots(startModel: ModelSnapshot, endModel: ModelSnapshot, timestamp: Date, extendRange: boolean = false) {
	// 	if (startModel.relativePath !== endModel.relativePath) {
	// 		throw new Error("Cannot get change between different files");
	// 	}

	// 	const startModelLines = startModel.content.split('\n');
	// 	const endModelLines = endModel.content.split('\n');
	// 	let startSameLines = ModelSnapshot.getNumCommonLinesAtBeginningOfSnapshots(startModel, endModel);
	// 	let endSameLines = ModelSnapshot.getNumCommonLinesAtEndOfSnapshots(startModel, endModel);

	// 	const startModelChangeRange = startModel.getRangeBetweenLines(startSameLines, startModelLines.length - endSameLines - 1).copy();
	// 	const endModelChangeRange = endModel.getRangeBetweenLines(startSameLines, endModelLines.length - endSameLines - 1).copy();
	// 	// console.log("[Start Same Lines]", startSameLines);
	// 	// console.log("[End Same Lines]", endSameLines);
	// 	// console.log('[Start Model Num Lines]', startModel.numberOfLines());
	// 	// console.log('[End Model Num Lines]', endModel.numberOfLines());
	// 	// console.log('[Start Model Change Range]', startModelChangeRange.toString());
	// 	// console.log('[End Model Change Range]', endModelChangeRange.toString());
	// 	// console.log('[Extend Range]', extendRange);
	// 	// console.log('[End Model Change Range]', endModelChangeRange.toString());
	// 	// console.log("[Start Model Lines]", startModelLines.length);
	// 	// console.log("[End Model Lines]", endModelLines.length);

	// 	if (extendRange) {
	// 		const extended = Range.getRNGRangesOfSizeContainingRanges(startModelChangeRange, endModelChangeRange, 4, startModelLines.length, endModelLines.length);
	// 		const changeText = endModel.getTextInRange(extended.range2);
	// 		// console.log("[Extended Range 1]", extended.range1.toString());
	// 		// console.log("[Extended Range 2]", extended.range2.toString());
	// 		return new Change(changeText, extended.range1, startModel.relativePath, timestamp, endModel.hash, extended.range2);
	// 	}


	// 	const changeText = endModel.getTextInRange(endModelChangeRange);

	// 	// console.log('[Consolidated Change Text]', `\`${changeText}\``);
	// 	return new Change(changeText, startModelChangeRange, startModel.relativePath, timestamp, endModel.hash, endModelChangeRange);
	// }

	getFinalModelRange() {
		const lines = this.text.split('\n');
		const start = this.range.start.copy();
		const end = new Position(start.lineNumber + lines.length - 1, lines[lines.length - 1].length);
		return new Range(start, end);
	}

	moveDownByLines(lines: number) {
		this.range.moveDownByLines(lines);
		return this;
	}

	lineDelta() {
		return this.text.split('\n').length - this.range.numberOfLines();
	}

	toString() {
		return `${this.relativePath}, ${this.range.toString()}, ${this.timestamp}, numNewLines: ${this.text.split('\n').length}`;
	}

	copy() {
		return new Change(this.text, this.range.copy(), this.relativePath, this.timestamp, this.finalModelHash, this.finalModelRange?.copy());
	}

	updateTimestamp(timestamp: Date) {
		this.timestamp = timestamp;
	}
}
