const path = require("path");
const extractTextPlugin = require('extract-text-webpack-plugin');

const extractPlugin = new extractTextPlugin({
  filename: 'dist/bundle.min.css'
});

const config = {
  entry: `${path.resolve(__dirname, "app/assets/src/")}/index.js`,
  output:  {
    path: path.resolve(__dirname, "app/assets/"),
    filename: "dist/bundle.min.js"
  },
  devtool: 'source-map',
  target: 'web',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [{
      test: /.js$/,
      exclude: path.resolve(__dirname, "node_modules/"),
      loader: "babel-loader"
    },{
      test: /.jsx$/,
      exclude: path.resolve(__dirname, "node_modules/"),
      loader: "babel-loader"
    },
    { // sass / scss loader for webpack
      test: /\.(sass|css|scss)$/,
      loader: extractTextPlugin.extract({
        fallback: 'style-loader',
        use: 'css-loader?{"minimize":true}!sass-loader'
      })
    },
    {
      test: /\.(png|eot|ttf|svg)$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'fonts/[name].[ext]',
        mimetype: 'application/font-woff',
        publicPath: (url) => {
          return `/assets/${url.replace(/fonts/, '')}`
        }
      }
    },
    {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'fonts/[name].[ext]',
        mimetype: 'application/font-woff',
        publicPath: (url) => {
          return `/assets/${url.replace(/fonts/, '')}`
        }
      }
    }]
  },
  plugins: [
    extractPlugin,
  ]
}

module.exports = config;
