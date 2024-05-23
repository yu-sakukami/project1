import Diff from './base';
import { generateOptions } from './utils';

//@ts-ignore
export const lineDiff = new Diff();
//@ts-ignore
lineDiff.tokenize = function (value) {
  let retLines = [],
    linesAndNewlines = value.split(/(\n|\r\n)/);

  // Ignore the final empty token that occurs if the string ends with a new line
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }

  // Merge the content and line separators into single tokens
  for (let i = 0; i < linesAndNewlines.length; i++) {
    let line = linesAndNewlines[i];

    if (i % 2 && !this.options!.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options!.ignoreWhitespace) {
        line = line.trim();
      }
      retLines.push(line);
    }
  }

  return retLines;
};

//@ts-ignore
export function diffLines(oldStr, newStr, callback = {}) { return lineDiff.diff(oldStr, newStr, callback); }

export function diffWithPrefixPostfix(oldString: string, newString: string, differ: any) {
  let numEndlineIncluded = 0
  if (!oldString.endsWith('\n')) {
    oldString += '\n';
    numEndlineIncluded++
  }
  if (!newString.endsWith('\n')) {
    numEndlineIncluded++
    newString += '\n';
  }
  let commonPrefix: { value: string, count: number }[] = [];
  let commonPostfix: { value: string, count: number }[] = [];

  let oldLines = oldString.split('\n');
  let newLines = newString.split('\n');

  for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
    if (oldLines[i] === newLines[i]) {
      commonPrefix.push({ value: oldLines[i], count: 1 });
      oldLines = oldLines.slice(1)
      newLines = newLines.slice(1)
    } else {
      break;
    }
  }

  for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
    if (oldLines[oldLines.length - 1 - i] === newLines[newLines.length - 1 - i] || newLines[i] === '') {
      commonPostfix.unshift({ value: oldLines[oldLines.length - 1 - i], count: 1 });
      oldLines = oldLines.slice(0, oldLines.length - 1 - i)
      newLines = newLines.slice(0, newLines.length - 1 - i)
    } else {
      break;
    }
  }

  const finalDiff = [...commonPrefix, ...differ.diff(oldString, newString), ...commonPostfix]
  const lastLine = finalDiff.slice(-1)[0]
  if (numEndlineIncluded === 1 && lastLine.value === '' && !lastLine.added && !lastLine.removed) {
    finalDiff.pop()
  }
  return finalDiff
}
//@ts-ignore
export function diffTrimmedLines(oldStr, newStr, callback = {}) {
  let options = generateOptions(callback, { ignoreWhitespace: true });
  return lineDiff.diff(oldStr, newStr, options);
}
