const merge = require("webpack-merge");
const commonConfig = require("./webpack.config.common.js");

module.exports = merge(commonConfig, {
  devtool: "cheap-module-eval-source-map",
  mode: "development",
});
