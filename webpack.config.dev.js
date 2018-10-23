const merge = require("webpack-merge");
const path = require("path");
const commonConfig = require("./webpack.config.common.js");

module.exports = merge(commonConfig, {
  devtool: "source-map",
  mode: "development"
});
