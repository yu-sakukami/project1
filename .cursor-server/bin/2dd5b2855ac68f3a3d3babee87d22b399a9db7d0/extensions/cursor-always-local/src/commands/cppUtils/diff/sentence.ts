import Diff from './base';

//@ts-ignore
export const sentenceDiff = new Diff();
//@ts-ignore
sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};

//@ts-ignore
export function diffSentences(oldStr, newStr, callback) { return sentenceDiff.diff(oldStr, newStr, callback); }
