/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const withNodeDefaults = require('../shared.webpack.config').node;

module.exports = withNodeDefaults({
	context: __dirname,
	entry: {
		main: './src/main.ts',
	},
	output: {
		filename: 'main.js',
		path: path.join(__dirname, 'dist')
	},
	plugins: [
		// @ts-ignore
		new webpack.IgnorePlugin({
			resourceRegExp: /crypto\/build\/Release\/sshcrypto\.node$/,
		}),
		// @ts-ignore
		new webpack.IgnorePlugin({
			resourceRegExp: /cpu-features/,
		})
	]
});