import Diff from './base';
import { generateOptions } from './utils';

// Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
//
// Ranges and exceptions:
// Latin-1 Supplement, 0080–00FF
//  - U+00D7  × Multiplication sign
//  - U+00F7  ÷ Division sign
// Latin Extended-A, 0100–017F
// Latin Extended-B, 0180–024F
// IPA Extensions, 0250–02AF
// Spacing Modifier Letters, 02B0–02FF
//  - U+02C7  ˇ &#711;  Caron
//  - U+02D8  ˘ &#728;  Breve
//  - U+02D9  ˙ &#729;  Dot Above
//  - U+02DA  ˚ &#730;  Ring Above
//  - U+02DB  ˛ &#731;  Ogonek
//  - U+02DC  ˜ &#732;  Small Tilde
//  - U+02DD  ˝ &#733;  Double Acute Accent
// Latin Extended Additional, 1E00–1EFF
const extendedWordChars = /^[a-zA-Z\u{C0}-\u{FF}\u{D8}-\u{F6}\u{F8}-\u{2C6}\u{2C8}-\u{2D7}\u{2DE}-\u{2FF}\u{1E00}-\u{1EFF}]+$/u;

const reWhitespace = /\S/;

//@ts-ignore
export const wordDiff = new Diff();
//@ts-ignore
wordDiff.equals = function (left, right) {
  if (this.options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }
  return left === right || (this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right));
};
//@ts-ignore
wordDiff.tokenize = function (value) {
  // All whitespace symbols except newline group into one token, each newline - in separate token
  let tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);

  // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
  for (let i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2]
      && extendedWordChars.test(tokens[i])
      && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
};

//@ts-ignore
export function diffWords(oldStr, newStr, options = {}, ignoreWhitespace = true) {
  // if either oldStr or newStr is longer than 20_000 characters or 2000 words, we print a warning saying that diff was aborted, and we return the trivial diff (everything changed)
  // this is primarily because we run the diffWords in the main process a lot of the time, which is very bad practice
  // we should ideally never use this function
  if (oldStr.length > 20_000 || newStr.length > 20_000 || (wordDiff.tokenize(oldStr)).length > 2000 || wordDiff.tokenize(newStr).length > 2000) {
    console.error("BAD BAD BAD BAD BAD. THIS SHOULD NOT HAPPEN. PLEASE FIX THE CPP BUG. diffWords received strings that were too long. Returning the trivial diff.", oldStr.length, newStr.length)
    return [
      {
        value: oldStr,
        removed: true,
      },
      {
        value: newStr,
        added: true
      }
    ]
  }

  options = generateOptions(options, { ignoreWhitespace });
  return wordDiff.diff(oldStr, newStr, options);
}

//@ts-ignore
export function diffWordsWithSpace(oldStr, newStr, options) {
  return wordDiff.diff(oldStr, newStr, options);
}
