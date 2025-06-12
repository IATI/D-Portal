const path = require('path');

const webpack = require('webpack');

const package = require('../package.json');
console.log("VERSION == "+package.version)

module.exports = {
  devtool: false,
  plugins: [
	new webpack.DefinePlugin({
		__VERSION__: package.version
	}),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  entry: './js/ctrack.js',
  resolve: {
    fallback : {
      fs: false,
      express: false,
      module: false,
      buffer: require.resolve('buffer'),
      util: require.resolve("util/"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      path: require.resolve("path-browserify"),
      vm: require.resolve("vm-browserify"),
      zlib: require.resolve("browserify-zlib"),
    },
  },
  module: {
    rules: [
      {
        test: require.resolve("express"),
        use: 'null-loader',
      },
      {
        test: /\.(txt|html|css|sql)$/i,
        use: { loader:'raw-loader', options:{ esModule: false, } },
      },
    ],
  },
  performance: {
    hints: false,
    maxEntrypointSize: 555555,
    maxAssetSize: 555555,
  },
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.resolve(__dirname, 'jslib/'),
    filename: 'ctrack.js',
    globalObject: 'this',
    library: {
//      name: "ctrack",
      type: 'module',
    },
  },
};

