const path = require("path");

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
