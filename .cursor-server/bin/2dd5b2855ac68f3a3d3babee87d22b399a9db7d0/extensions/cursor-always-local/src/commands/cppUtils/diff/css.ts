import Diff from './base';

//@ts-ignore
export const cssDiff = new Diff();
//@ts-ignore
cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};

//@ts-ignore
export function diffCss(oldStr, newStr, callback) { return cssDiff.diff(oldStr, newStr, callback); }
