const path = require("path");
const extractTextPlugin = require('extract-text-webpack-plugin');

const extractPlugin = new extractTextPlugin({
  filename: 'dist/bundle.min.css'
});

const config = {
  entry: `${path.resolve(__dirname, "app/assets/javascripts/")}/index.js`,
  output:  {
    path: path.resolve(__dirname, "app/assets/javascripts/"),
    filename: "dist/bundle.min.js"
  },
  devtool: 'source-map',
  target: 'web',
  module: {
    rules: [{
      test: /.js$/,
      exclude: path.resolve(__dirname, "node_modules/"),
      loader: "babel-loader"
    },
    {
      test: /.scss$/,
      use: extractPlugin.extract({
        fallback: "style-loader",
        use: ["css-loader", "sass-loader"]
      })
    }]
  },
  watch: true,
  plugins: [ extractPlugin ]
}

module.exports = config;
