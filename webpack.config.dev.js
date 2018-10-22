const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const config = {
  plugins: [
    new MiniCssExtractPlugin({
      filename: "dist/bundle.min.css"
    })
  ],
  mode: "development",
  entry: `${path.resolve(__dirname, "app/assets/src/")}/index.js`,
  output: {
    path: path.resolve(__dirname, "app/assets/"),
    filename: "dist/bundle.min.js"
  },
  devtool: "cheap-module-eval-source-map",
  target: "web",
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: path.resolve(__dirname, "node_modules/"),
        loader: "babel-loader"
      },
      {
        test: /.jsx$/,
        exclude: path.resolve(__dirname, "node_modules/"),
        loader: "babel-loader"
      },
      {
        // sass / scss loader for webpack
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              minimize: true,
              sourceMap: true
            }
          },
          {
            loader: "sass-loader",
            options: {
              minimize: true,
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(png|eot|ttf|svg)$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "fonts/[name].[ext]",
          mimetype: "application/font-woff",
          publicPath: url => {
            return `/assets/${url.replace(/fonts/, "")}`;
          }
        }
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "fonts/[name].[ext]",
          mimetype: "application/font-woff",
          publicPath: url => {
            return `/assets/${url.replace(/fonts/, "")}`;
          }
        }
      }
    ]
  }
};

module.exports = config;
