const path = require("path");
const webpackConfig = require("./webpack.config.common");

const rootFolder = __dirname;

// Read aliases from webpack configuration and convert to a format that jest understands
const mappedModuleAliases = Object.entries(webpackConfig.resolve.alias)
  .map(([key, value]) => [`^${key}/(.*)$`, `${value}/$1`])
  .reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

module.exports = {
  verbose: true,
  moduleNameMapper: mappedModuleAliases,
};
