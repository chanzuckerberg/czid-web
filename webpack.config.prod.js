const merge = require("webpack-merge");
const path = require("path");
const webpack = require("webpack");
// const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const commonConfig = require("./webpack.config.common.js");

module.exports = merge(commonConfig, {
  devtool: "source-map",
  mode: "production"
  // plugins: [
  //   new UglifyJsPlugin({
  //     uglifyOptions: {
  //       mangle: false
  //     }
  //   }),
  //   new webpack.DefinePlugin({
  //     "process.env.NODE_ENV": JSON.stringify("production")
  //   })
  // ]
});
