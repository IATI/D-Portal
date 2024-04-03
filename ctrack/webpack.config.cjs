const path = require('path');

const webpack = require('webpack');

//const CopyPlugin = require("copy-webpack-plugin");

//var ZipPlugin = require('zip-webpack-plugin');


let dd=new Date()
let da=new Date(dd.getFullYear(), 0, 0)
let db=new Date(dd.getFullYear()+1, 0, 0)
let dd_yy=(dd.getFullYear()-2000)
let dd_dd=Math.floor( 100000 * (dd-da) / (db-da) )
let dd_version=dd_yy+"."+( ("0000"+dd_dd).slice(-5) )

console.log("VERSION == "+dd_version)

module.exports = {
  devtool: false,
  plugins: [
	new webpack.DefinePlugin({
		__VERSION__: JSON.stringify(dd_version)
	}),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),

/*
    new CopyPlugin({
      patterns: [
        { from: "static/manifest.json",     to: "manifest.json" },
        { from: "static/index.html",        to: "index.html" },
        { from: "static/index.js",          to: "index.js" },
        { from: "static/arss.css",          to: "arss.css" },
        { from: "static/arss.worker.js",    to: "arss.worker.js" },

      ],
    }),
    new ZipPlugin({
      filename: 'ctrack.zip',
    }),
*/
  ],
  entry: './js/ctrack.js',
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
    ],
  },
  performance: {
    hints: false,
    maxEntrypointSize: 555555,
    maxAssetSize: 555555,
  },
  output: {
    path: path.resolve(__dirname, 'jslib/'),
    filename: 'ctrack.js',
    globalObject: 'this',
    library: {
      name: "ctrack",
      type: 'umd',
    },
  },
};

