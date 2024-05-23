import Diff from './base';

//@ts-ignore
export const arrayDiff = new Diff();
//@ts-ignore
arrayDiff.tokenize = function (value) {
  return value.slice();
};
//@ts-ignore
arrayDiff.join = arrayDiff.removeEmpty = function (value) {
  return value;
};

//@ts-ignore
export function diffArrays(oldArr, newArr, callback) { return arrayDiff.diff(oldArr, newArr, callback); }
