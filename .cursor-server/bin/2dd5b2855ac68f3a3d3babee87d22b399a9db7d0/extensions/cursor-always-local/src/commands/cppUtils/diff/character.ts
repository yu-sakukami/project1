import Diff from './base';

//@ts-ignore
export const characterDiff = new Diff();
//@ts-ignore
export function diffChars(oldStr, newStr, options) {
	// if either oldStr or newStr is longer than 2000 characters, we print a warning saying that diff was aborted, and we return the trivial diff (everything changed)
	// this is primarily because we run the diffWords in the main process a lot of the time, which is very bad practice
	// we should ideally never use this function
	if (oldStr.length > 2000 || newStr.length > 2000) {
		console.error("BAD BAD BAD BAD BAD. THIS SHOULD NOT HAPPEN. PLEASE FIX THE CPP BUG. diffChars received strings that were too long. Returning the trivial diff.", oldStr.length, newStr.length)
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

	return characterDiff.diff(oldStr, newStr, options);
}
