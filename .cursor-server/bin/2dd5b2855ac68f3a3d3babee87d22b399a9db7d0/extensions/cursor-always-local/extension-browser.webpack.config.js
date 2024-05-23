//@ts-check

'use strict';

const withBrowserDefaults = require('../shared.webpack.config').browser;
const path = require('path');

module.exports = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: './src/main.ts'
	},
	output: {
		filename: 'main.js',
		path: path.join(__dirname, 'dist')
	},
	// externals: ['vscode']
});
