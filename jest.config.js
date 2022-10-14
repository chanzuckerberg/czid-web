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
  coverageDirectory: "<rootDir>/client-coverage",
  coveragePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/build/"],
  coverageReporters: ["text-summary", "json", "html"],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 40,
      lines: 55,
      statements: 55,
    },
  },
  globals: {},
  moduleDirectories: ["node_modules", "src"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  modulePaths: ["<rootDir>/"],
  rootDir: "./",
  testMatch: ["<rootDir>/**/**/*.test.{js,jsx,ts,tsx}"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/build/"],
};
