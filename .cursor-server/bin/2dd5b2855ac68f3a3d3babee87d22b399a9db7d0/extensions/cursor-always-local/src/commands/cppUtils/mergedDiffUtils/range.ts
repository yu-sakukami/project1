import { IRange } from '../../../proto/aiserver/v1/cpp_pb';

export enum OverlapBehaviour {
	None,
	PartialTop,
	PartialBottom,
	ContainedWithin,
	Containing,
}

export class Position {
	lineNumber: number;
	column: number;

	constructor(lineNumber: number, column: number) {
		this.lineNumber = lineNumber;
		this.column = column;
	}

	isAfterOrEqual(other: Position) {
		return this.lineNumber > other.lineNumber || (this.lineNumber === other.lineNumber && this.column >= other.column);
	}

	isAfter(other: Position) {
		return this.lineNumber > other.lineNumber || (this.lineNumber === other.lineNumber && this.column > other.column);
	}

	isBeforeOrEqual(other: Position) {
		return this.lineNumber < other.lineNumber || (this.lineNumber === other.lineNumber && this.column <= other.column);
	}

	isBefore(other: Position) {
		return this.lineNumber < other.lineNumber || (this.lineNumber === other.lineNumber && this.column < other.column);
	}

	isLineAfterOrEqual(lineNumber: number) {
		return this.lineNumber >= lineNumber;
	}

	isLineAfter(lineNumber: number) {
		return this.lineNumber > lineNumber;
	}

	isLineBeforeOrEqual(lineNumber: number) {
		return this.lineNumber <= lineNumber;
	}

	isLineBefore(lineNumber: number) {
		return this.lineNumber < lineNumber;
	}

	copy() {
		return new Position(this.lineNumber, this.column);
	}


	min(other: Position) {
		if (this.isBefore(other)) {
			return this;
		} else {
			return other;
		}
	}

	max(other: Position) {
		if (this.isAfter(other)) {
			return this;
		} else {
			return other;
		}
	}
}

export class Range {
	start: Position;
	end: Position;

	constructor(start: Position, end: Position);
	constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
	constructor(startOrStartLineNumber: Position | number, endOrStartColumn?: Position | number, endLineNumber?: number, endColumn?: number) {
		if (typeof startOrStartLineNumber === 'number' && typeof endOrStartColumn === 'number' && typeof endLineNumber === 'number' && typeof endColumn === 'number') {
			this.start = new Position(startOrStartLineNumber, endOrStartColumn);
			this.end = new Position(endLineNumber, endColumn);
		} else if (typeof startOrStartLineNumber === 'object' && typeof endOrStartColumn === 'object') {
			this.start = startOrStartLineNumber;
			this.end = endOrStartColumn as Position;
		} else {
			throw new Error('Invalid arguments for Range constructor');
		}
	}


	numberOfLines() {
		return this.end.lineNumber - this.start.lineNumber + 1;
	}

	getOverlap(other: Range) {
		if (this.start.isAfter(other.end) || this.end.isBefore(other.start)) {
			return OverlapBehaviour.None;
		} else if (this.start.isBeforeOrEqual(other.start) && this.end.isBeforeOrEqual(other.end)) {
			return OverlapBehaviour.PartialTop;
		} else if (this.start.isAfterOrEqual(other.start) && this.end.isAfterOrEqual(other.end)) {
			return OverlapBehaviour.PartialBottom;
		} else if (this.start.isAfterOrEqual(other.start) && this.end.isBeforeOrEqual(other.end)) {
			return OverlapBehaviour.ContainedWithin;
		} else if (this.start.isBeforeOrEqual(other.start) && this.end.isAfterOrEqual(other.end)) {
			return OverlapBehaviour.Containing;
		}
		throw new Error('Invalid overlap behaviour');
	}

	getOverlapByLines(other: Range) {
		if (this.start.isLineAfter(other.end.lineNumber) || this.end.isLineBefore(other.start.lineNumber)) {
			return OverlapBehaviour.None;
		} else if (this.start.isLineBeforeOrEqual(other.start.lineNumber) && this.end.isLineBeforeOrEqual(other.end.lineNumber)) {
			return OverlapBehaviour.PartialTop;
		} else if (this.start.isLineAfterOrEqual(other.start.lineNumber) && this.end.isLineAfterOrEqual(other.end.lineNumber)) {
			return OverlapBehaviour.PartialBottom;
		} else if (this.start.isLineAfterOrEqual(other.start.lineNumber) && this.end.isLineBeforeOrEqual(other.end.lineNumber)) {
			return OverlapBehaviour.ContainedWithin;
		} else if (this.start.isLineBeforeOrEqual(other.start.lineNumber) && this.end.isLineAfterOrEqual(other.end.lineNumber)) {
			return OverlapBehaviour.Containing;
		}
		throw new Error('Invalid overlap behaviour');
	}


	static merge(range1?: Range, range2?: Range) {
		if (range1 == undefined && range2 == undefined) {
			throw new Error('Cannot merge two null ranges');
		} else if (range1 == undefined && range2) {
			return range2.copy();
		} else if (range2 == undefined && range1) {
			return range1.copy();
		} else {
			return new Range(range1!.copy().start.min(range2!.copy().start), range1!.end.max(range2!.copy().end));
		}
	}

	static getRangeExpandedByLines(range: Range, topRadius: number, bottomRadius: number) {
		return new Range(
			new Position(range.start.lineNumber - topRadius, range.start.column),
			new Position(range.end.lineNumber + bottomRadius, range.end.column),
		);
	}

	static getRNGRangeOfSizeContainingRange(range: Range, size: number, maxLines: number = 100) {
		if (size < range.numberOfLines()) {
			return new Range(range.start, range.end);
		}

		const totalExtraLines = size - range.numberOfLines();
		let topRadius = Math.round(Math.random() * totalExtraLines);
		let bottomRadius = totalExtraLines - topRadius;
		// Ensure topRadius does not go below 0
		if (topRadius < 0) {
			bottomRadius += Math.abs(topRadius);
			topRadius = 0;
		}
		if (bottomRadius > maxLines) {
			bottomRadius = maxLines;
		}
		topRadius = Math.max(0, topRadius);
		// Ensure bottomRadius does not exceed maxLines
		bottomRadius = Math.min(maxLines, bottomRadius);
		return {
			range: Range.getRangeExpandedByLines(range, topRadius, bottomRadius),
			extraLinesOnTop: topRadius,
			extraLinesOnBottom: bottomRadius,
		}
	}

	static getRNGRangesOfSizeContainingRanges(range1: Range, range2: Range, size: number, maxLines1: number, maxLines2: number) {
		const range1cpy = range1.copy();
		const range2cpy = range2.copy();

		// if (range1cpy.numberOfLines() !== range2cpy.numberOfLines()) {
		//   throw new Error('Ranges must have same number of lines');
		// }

		if (size < range1cpy.numberOfLines() || size < range2cpy.numberOfLines()) {
			return {
				range1: new Range(range1cpy.start, range1cpy.end),
				range2: new Range(range2cpy.start, range2cpy.end),
			}
		}

		const totalExtraLines = size - range1cpy.numberOfLines();
		let topRadius = Math.round(Math.random() * totalExtraLines);
		let bottomRadius = totalExtraLines - topRadius;
		// Ensure topRadius does not go below 0
		if (topRadius < 0) {
			bottomRadius += Math.abs(topRadius);
			topRadius = 0;
		}
		if (bottomRadius > maxLines1 || bottomRadius > maxLines2) {
			bottomRadius = Math.min(maxLines1, maxLines2);
		}

		// console.log("[Range 1]", range1cpy.toString())
		// console.log("[Range 2]", range2cpy.toString())
		const expandedRange1 = Range.getRangeExpandedByLines(range1cpy, topRadius, bottomRadius);
		const expandedRange2 = Range.getRangeExpandedByLines(range2cpy, topRadius, bottomRadius);
		// console.log("[Expanded Range 1]", expandedRange1.toString())
		// console.log("[Expanded Range 2]", expandedRange2.toString())


		return {
			range1: expandedRange1,
			range2: expandedRange2,
		}
	}

	asZeroIndexed() {
		this.start.lineNumber -= 1;
		this.start.column -= 1;
		this.end.lineNumber -= 1;
		this.end.column -= 1;
		return this;
	}

	print() {
		console.log(`[${this.start.lineNumber}-${this.start.column}:${this.end.lineNumber}-${this.end.column}]`)
	}

	toString() {
		return `[${this.start.lineNumber}-${this.start.column}:${this.end.lineNumber}-${this.end.column}]`
	}

	static createFromIRange(range: IRange) {
		return new Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
	}

	copy() {
		return new Range(this.start.lineNumber, this.start.column, this.end.lineNumber, this.end.column);
	}

	moveDownByLines(lineDelta: number) {
		// console.log("[Moving Range Down By Lines]", lineDelta, this.toString())
		this.start.lineNumber += lineDelta;
		this.end.lineNumber += lineDelta;
		// console.log("[Done Moving Range Down By Lines]", lineDelta, this.toString())
		return this;
	}
}

