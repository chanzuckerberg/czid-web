const merge = require("webpack-merge");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const commonConfig = require("./webpack.config.common.js");

module.exports = merge(commonConfig, {
  devtool: "source-map",
  mode: "production",
  optimization: {
    splitChunks: {
      cacheGroups: {
        default: false, // disable default cache group
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: "all",
          enforce: true, // always create a chunk
        },
      },
    },
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          mangle: true,
          // We need this option for rails react_component.
          keep_fnames: true,
        },
        parallel: true,
        sourceMap: true,
      }),
    ],
  },
});
