const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const devConfig = require('./webpack.config.dev.js');

module.exports = merge(devConfig, {
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        mangle: false,
      }
    }),
  ]
});
