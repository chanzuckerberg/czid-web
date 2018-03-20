const merge = require('webpack-merge');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const devConfig = require('./webpack.config.dev.js');

module.exports = merge(devConfig, {
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        mangle: false,
      }
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
  ]
});
