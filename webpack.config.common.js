const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// modules that are not polyfilled
const includedNodeModules = ["query-string", "strict-uri-encode"];

const config = {
  entry: `${path.resolve(__dirname, "app/assets/src/")}/index.js`,
  output: {
    path: path.resolve(__dirname, "app/assets/dist"),
    filename: "bundle.min.js"
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "bundle.min.css"
    })
  ],
  devtool: "source-map",
  target: "web",
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: new RegExp(
          `/node_modules/(?!(${includedNodeModules.join("|")})/).*/`
        ),
        loader: "babel-loader"
      },
      {
        test: /.jsx$/,
        exclude: new RegExp(
          `/node_modules/(?!(${includedNodeModules.join("|")})/).*/`
        ),
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
