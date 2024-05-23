/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LogOutputChannel } from 'vscode';
import * as vscode from 'vscode';


export class AlwaysLocalLogger {
	private static output: LogOutputChannel;
	// private static logger: pino.Logger;
	// private static user: string = '';
	// private static repo: string = '';

	// orgId: 'anysphere-a7r3',
	public static init(): void {
		AlwaysLocalLogger.output = vscode.window.createOutputChannel('Cursor Always Local', { log: true });

		// this.logger = pino({
		// 	level: 'info',
		// 	base: { service: 'local-indexing', user: this.user, repo: this.repo },
		// 	timestamp: true,
		// },
		// 	pino.transport({
		// 		target: '@axiomhq/pino',
		// 		options: {
		// 			dataset: 'local-indexing',
		// 			token: 'xaat-a51088e6-7889-41c0-b440-cfd4601acdd7',
		// 		},
		// 	}),
		// );
	}

	public static setUser(user: string): void {
		// this.user = user;
	}
	public static setRepo(repo: string): void {
		// this.repo = repo;
	}

	public static error(msg: string, ...args: any[]): void {
		AlwaysLocalLogger.output.error(msg, ...args);
		// this.logger.error(msg, ...args);
	}
	public static warn(msg: string, ...args: any[]): void {
		AlwaysLocalLogger.output.warn(msg, ...args);
		// this.logger.warn(msg, ...args);
	}
	public static info(msg: string, ...args: any[]): void {
		AlwaysLocalLogger.output.info(msg, ...args);
		// this.logger.info(msg, ...args);
	}
	public static debug(msg: string, ...args: any[]): void {
		AlwaysLocalLogger.output.debug(msg, ...args);
		// this.logger.debug(msg, ...args);
	}
	public static trace(msg: string, ...args: any[]): void {
		AlwaysLocalLogger.output.trace(msg, ...args);
		// this.logger.trace(msg, ...args);
	}
}


const _UUIDPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(value: string): boolean {
	return _UUIDPattern.test(value);
}

declare const crypto: undefined | {
	//https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#browser_compatibility
	getRandomValues?(data: Uint8Array): Uint8Array;
	//https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID#browser_compatibility
	randomUUID?(): string;
};

export const generateUuid = (function (): () => string {

	// use `randomUUID` if possible
	if (typeof crypto === 'object' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID.bind(crypto);
	}

	// use `randomValues` if possible
	let getRandomValues: (bucket: Uint8Array) => Uint8Array;
	if (typeof crypto === 'object' && typeof crypto.getRandomValues === 'function') {
		getRandomValues = crypto.getRandomValues.bind(crypto);

	} else {
		getRandomValues = function (bucket: Uint8Array): Uint8Array {
			for (let i = 0; i < bucket.length; i++) {
				bucket[i] = Math.floor(Math.random() * 256);
			}
			return bucket;
		};
	}

	// prep-work
	const _data = new Uint8Array(16);
	const _hex: string[] = [];
	for (let i = 0; i < 256; i++) {
		_hex.push(i.toString(16).padStart(2, '0'));
	}

	return function generateUuid(): string {
		// get data
		getRandomValues(_data);

		// set version bits
		_data[6] = (_data[6] & 0x0f) | 0x40;
		_data[8] = (_data[8] & 0x3f) | 0x80;

		// print as string
		let i = 0;
		let result = '';
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += '-';
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += '-';
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += '-';
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += '-';
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		result += _hex[_data[i++]];
		return result;
	};
})();
