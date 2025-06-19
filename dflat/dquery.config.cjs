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
  entry: './js/dquery.js',
  resolve: {
    fallback : {
      fs: false,
      express: false,
      buffer: require.resolve('buffer'),
      stream: require.resolve("stream-browserify"),
      path: require.resolve("path-browserify"),
      util: require.resolve("util/"),
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
        test: /\.txt$/i,
        use: { loader:'raw-loader', options:{ esModule: false, } },
      },
      {
        test: /\.html$/i,
        use: { loader:'raw-loader', options:{ esModule: false, } },
      },
      {
        test: /\.css$/i,
        use: { loader:'raw-loader', options:{ esModule: false, } },
      },
      {
        test: /\.sql$/i,
        use: { loader:'raw-loader', options:{ esModule: false, } },
      },
    ],
  },
  performance: {
    hints: false,
    maxEntrypointSize: 555555,
    maxAssetSize: 555555,
  },
  output: {
    path: path.resolve(__dirname, 'html/lib/dquery_loader/'),
    filename: 'dquery.js',
    globalObject: 'this',
    library: {
      name: "dquery",
      type: 'umd',
    },
  },
};

