const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

// modules that are not compatible with IE11
const includedNodeModules = ["query-string", "strict-uri-encode"];

const config = {
  entry: `${path.resolve(__dirname, "app/assets/src/")}/index.jsx`,
  output: {
    path: path.resolve(__dirname, "app/assets/"),
    filename: "dist/[name].bundle.min.js",
  },
  resolve: {
    extensions: [".js", ".jsx"],
    alias: {
      "~": path.resolve(__dirname, "app/assets/src"),
      "~ui": path.resolve(__dirname, "app/assets/src/components/ui"),
      "~utils": path.resolve(__dirname, "app/assets/src/components/utils"),
      styles: path.resolve(__dirname, "app/assets/src/styles"),
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "dist/[name].bundle.min.css",
    }),
  ],
  devtool: "source-map",
  target: "web",
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: new RegExp(
          `/node_modules/(?!(${includedNodeModules.join("|")})/).*/`
        ),
        loader: "babel-loader",
      },
      {
        test: /.jsx$/,
        exclude: new RegExp(
          `/node_modules/(?!(${includedNodeModules.join("|")})/).*/`
        ),
        loader: "babel-loader",
      },
      {
        // Use CSS modules for new files.
        test: /\.(sa|sc|c)ss$/,
        exclude: [
          path.resolve(__dirname, "node_modules/"),
          path.resolve(__dirname, "app/assets/src/styles"),
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
              minimize: true,
              sourceMap: true,
            },
          },
        ],
      },
      {
        // Sass / Scss loader for legacy files in assets/src/styles.
        test: /\.(sa|sc|c)ss$/,
        include: [
          path.resolve(__dirname, "node_modules/"),
          path.resolve(__dirname, "app/assets/src/styles"),
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
              minimize: true,
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(png|eot|ttf|svg)$/,
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
};

module.exports = config;
