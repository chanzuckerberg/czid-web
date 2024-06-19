const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path-browserify");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

// modules that are not compatible with IE11
const includedNodeModules = ["query-string", "strict-uri-encode"];

const STYLES_PATH = "app/assets/src/styles";

const config = {
  entry: `${path.resolve(__dirname, "app/assets/src/")}/index.tsx`,
  output: {
    path: path.resolve(__dirname, "app/assets/"),
    filename: "dist/[name].bundle.min.js",
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: {
      "~": path.resolve(__dirname, "app/assets/src"),
      "~ui": path.resolve(__dirname, "app/assets/src/components/ui"),
      "~utils": path.resolve(__dirname, "app/assets/src/components/utils"),
      styles: path.resolve(__dirname, STYLES_PATH),
    },
    fallback: {
      util: require.resolve("util"),
      path: require.resolve("path-browserify"),
      process: require.resolve("process/browser"), // for env var __dirname
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "dist/[name].bundle.min.css",
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
  devtool: "source-map",
  target: "web",
  module: {
    rules: [
      {
        test: /.(js|ts)x?$/,
        exclude: new RegExp(
          `/node_modules/(?!(${includedNodeModules.join("|")})/).*/`,
        ),
        loader: "babel-loader",
      },
      {
        // Use CSS modules for new files.
        test: /\.(sa|sc|c)ss$/,
        exclude: [
          path.resolve(__dirname, "node_modules/"),
          path.resolve(__dirname, STYLES_PATH),
          path.resolve(__dirname, "app/assets/src/loader.scss"),
        ],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              importLoaders: 2,
              modules: {
                mode: "local",
                localIdentName: "[local]-[hash:base64:5]",
              },
            },
          },
          {
            loader: "postcss-loader",
            options: {
              ident: "postcss",
              sourceMap: true,
              plugins: loader => [require("cssnano")({ preset: "default" })],
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              implementation: require("sass"),
            },
          },
        ],
      },
      {
        // Sass / Scss loader for legacy files in assets/src/styles.
        test: /\.(sa|sc|c)ss$/,
        include: [
          path.resolve(__dirname, "node_modules/"),
          path.resolve(__dirname, STYLES_PATH),
          path.resolve(__dirname, "app/assets/src/loader.scss"),
        ],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              importLoaders: 2,
              modules: {
                mode: "global",
              },
            },
          },
          {
            loader: "postcss-loader",
            options: {
              ident: "postcss",
              sourceMap: true,
              plugins: loader => [require("cssnano")({ preset: "default" })],
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              implementation: require("sass"),
            },
          },
        ],
      },
      {
        test: /\.(png|eot|ttf|svg|gif)$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "fonts/[name].[ext]",
          mimetype: "application/font-woff",
          publicPath: url => {
            return `/assets${url.replace(/fonts/, "")}`;
          },
        },
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "fonts/[name].[ext]",
          mimetype: "application/font-woff",
          publicPath: url => {
            return `/assets${url.replace(/fonts/, "")}`;
          },
        },
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        default: false, // disable default cache group
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: "all",
          enforce: true, // always create a chunk
          name: "vendors",
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: true,
          // We need this option for rails react_component.
          keep_fnames: true,
        },
        parallel: true,
        sourceMap: true,
      }),
    ],
  },
};

module.exports = config;
