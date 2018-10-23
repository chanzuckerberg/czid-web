const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

var STYLE_DIR = path.resolve(__dirname, "app/assets/src/styles");

const config = {
  resolve: {
    extensions: [".js", ".jsx"],
    alias: {
      styles: STYLE_DIR
    }
  },
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
  devtool: "source-map",
  target: "web",
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
        // Use CSS modules for new files.
        test: /\.(sa|sc|c)ss$/,
        exclude: [
          path.resolve(__dirname, "node_modules/"),
          path.resolve(__dirname, "app/assets/src/styles"),
          path.resolve(__dirname, "app/assets/src/loader.scss")
        ],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              minimize: true,
              sourceMap: true,
              modules: true,
              localIdentName: "[local]-[hash:base64:5]"
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
        // Legacy files in assets/src/styles.
        test: /\.(sa|sc|c)ss$/,
        include: [
          path.resolve(__dirname, "node_modules/"),
          path.resolve(__dirname, "app/assets/src/styles"),
          path.resolve(__dirname, "app/assets/src/loader.scss")
        ],
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
