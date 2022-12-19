const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  webpackFinal: async (config, { configType }) => {
    config.resolve["alias"] = {
      "~": path.resolve(__dirname, "../app/assets/src"),
      "~ui": path.resolve(__dirname, "../app/assets/src/components/ui"),
      "~utils": path.resolve(__dirname, "../app/assets/src/components/utils"),
      styles: path.resolve(__dirname, "../app/assets/src/styles"),
    };
    config.resolve.plugins = [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, "../stories/tsconfig.json"),
      }),
    ];
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        "style-loader",
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
        "sass-loader",
      ],
      include: [
        path.resolve(__dirname, "../stories"),
        path.resolve(__dirname, "../app/assets/src"),
      ],
    });

    // Return the altered config
    return config;
  },
};
