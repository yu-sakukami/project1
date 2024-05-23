import { DiffingProvider } from '@cursor/types';
import * as vscode from 'vscode';
import DiffMatchPatch from 'diff-match-patch';
import { search } from "fast-fuzzy";
import { diffLines, diffWords } from 'diff';

export type DiffObj = { value: string, added?: boolean, removed?: boolean };


export class Differ implements vscode.Disposable {
	constructor() {
		const diffingProvider: DiffingProvider = {
			wordDiffForPartialCode: async (oldCode: string, newCode: string, addToBothDirections: boolean = false): Promise<{
				finalText: string
				changes: DiffObj[]
				fullLineChanges: DiffObj[]
			}> => {

				// IDK Why this is required for CPP. TODO: Debug - DO NOT REMOVE
				if (newCode.endsWith('\n')) {
					newCode = newCode.slice(0, newCode.length - 1)
				}
				// CursorDebugLogger.info('----------------------------------------------------');
				// CursorDebugLogger.info('Getting Diff - Still Streaming');
				// CursorDebugLogger.info("Previous Code\n", oldCode);
				// CursorDebugLogger.info("New Code\n", newCode);

				const dmp = new DiffMatchPatch();

				const originalCodeLines = oldCode.split('\n');
				const newCodeLines = newCode.split('\n');
				const newLineCounts: { [key: string]: number } = {}

				for (let line of newCodeLines) {
					const trimmedLine = line.trim()
					if (trimmedLine === '') {
						continue;
					}
					newLineCounts[trimmedLine] ??= 0
					newLineCounts[trimmedLine]++
				}

				let minChangesI = null
				let minChangeCoeff = Infinity
				let minChanges = null
				let lastZero = originalCodeLines.length + 1


				for (let i = 0; i <= originalCodeLines.length; i++) {
					// Reasoning behin the bellow if:
					// This algorithm tries adding as many lines to the end of the new code as possible and finds the option with the least number of changes.
					// With this algorithm, if the new code changes a lot, we'll end up adding all (or a lot) of the original code to the end of the new code.
					// This if makes that much less likely to happen
					if (i < originalCodeLines.length && originalCodeLines[i].trim() !== '') {
						const specialChars = ['[', '{', '(', ')', '}', ']', ',', ' ', '\t'];
						const trimmedOriginalLine = originalCodeLines[i].trim()

						// console.log(trimmedOriginalLine, newLineCounts)
						if (!trimmedOriginalLine.split('').every(char => specialChars.includes(char))) {
							const matches = search(originalCodeLines[i], newCodeLines, { returnMatchData: true });
							if (matches.length > 0 && matches[0].score > 0.95) {
								const matchKey = matches[0].item.trim();
								if (newLineCounts.hasOwnProperty(matchKey)) {
									newLineCounts[matchKey]--
									if (newLineCounts[matchKey] == 0) {
										lastZero = i
									}
								}
							} else {
							}
						}
					}
				}


				for (let i = Math.min(lastZero + 1, originalCodeLines.length); i <= originalCodeLines.length; i++) {
					const newCodeLinesWithPostfix = [...newCodeLines, ...originalCodeLines.slice(i)]
					const changes = dmp.diff_main(originalCodeLines.join('\n'), newCodeLinesWithPostfix.join('\n'));
					const numAdditions = changes.filter((change) => change[0] === 1).length
					const numSubtractions = changes.filter((change) => change[0] === -1).length
					const numSubtractionsTotal = changes.filter((change) => change[0] === -1).map(change => change[1].length).reduce((sum, length) => sum + length, 0);
					const numAdditionsTotal = changes.filter((change) => change[0] === 1).map(change => change[1].length).reduce((sum, length) => sum + length, 0);
					const numChanges = changes.filter((change) => change[0] !== 0).map(change => change[1].length).reduce((sum, length) => sum + length, 0);
					const changeCoeff = numChanges + numAdditions * 5 + numSubtractions * 5

					if (changeCoeff < minChangeCoeff) {
						minChangesI = i
						minChanges = changes
						minChangeCoeff = changeCoeff
					}
				}

				if (minChanges === null) {
					throw Error("Changes are null. Shouldn't be happening.")
				}

				const lineDiffChanges = diffLines(oldCode, newCode, { newlineIsToken: true });
				const wordDiffChanges = diffWords(oldCode, newCode);


				return {
					finalText: [...newCodeLines, ...(minChangesI ? originalCodeLines.slice(minChangesI) : [])].join('\n'),
					fullLineChanges: lineDiffChanges,
					changes: wordDiffChanges
					// changes: minChanges!.map((change: any) => {
					// 	return {
					// 		value: change[1],
					// 		added: change[0] === 1 ? true : undefined,
					// 		removed: change[0] === -1 ? true : undefined,
					// 	}
					// })
				}
			},
			wordDiff: async (oldCode: string, newCode: string): Promise<{
				changes: DiffObj[]
			}> => {
				const dmp = new DiffMatchPatch();
				const changes = dmp.diff_main(oldCode, newCode);
				return {
					changes: changes.map(change => {
						return {
							value: change[1],
							added: change[0] === 1 ? true : undefined,
							removed: change[0] === -1 ? true : undefined,
						}
					})
				}
			}
		}

		vscode.cursor.registerDiffingProvider(diffingProvider);
	}

	dispose() {
	}
}