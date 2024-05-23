// @ts-check
const path = require('path');

const srcDir = path.join(__dirname, 'preview-src');
const outDir = path.join(__dirname, 'media');

require('../esbuild-webview-common').run({
	entryPoints: {
		'index': path.join(srcDir, 'index.tsx'),
	},
	srcDir,
	outdir: outDir,
}, process.argv);
