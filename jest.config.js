const path = require("path");

rootFolder = __dirname;

module.exports = {
  verbose: true,
  moduleNameMapper: {
    "^~/(.*)$": path.resolve(rootFolder, "app/assets/src") + "/$1",
    "^~ui/(.*)$":
      path.resolve(rootFolder, "app/assets/src/components/ui") + "/$1",
    "^~utils/(.*)$":
      path.resolve(rootFolder, "app/assets/src/components/utils") + "/$1",
    "^styles/(.*)$": path.resolve(rootFolder, "app/assets/src/styles") + "/$1",
  },
};
