//@ts-check

'use strict';

const path = require('path');
const withNodeDefaults = require('../shared.webpack.config').node;

const tsLoaderOptions = {
  compilerOptions: {
    'sourceMap': true,
    'esModuleInterop': true,
  },
  onlyCompileBundledFiles: true,
};

module.exports = withNodeDefaults({
  context: __dirname,
  entry: {
    main: './src/main.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          loader: 'vscode-nls-dev/lib/webpack-loader',
          options: {
            base: path.join(__dirname, 'src')
          }
        }, {
          loader: 'ts-loader',
          options: tsLoaderOptions
        }, {
          loader: path.resolve(__dirname, '../mangle-loader.js'),
          options: {
            configFile: path.join(__dirname, 'tsconfig.json')
          },
        },]
      }
    ]
  },
  output: {
    filename: 'main.js',
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs',
  },
});
