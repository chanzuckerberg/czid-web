const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.config.common.js");

module.exports = merge(commonConfig, {
  devtool: "eval-cheap-module-source-map",
  mode: "development",
});
