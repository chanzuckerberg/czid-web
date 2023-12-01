
module.exports = {
  plugins: [
    "@emotion",
    transformImports(),
  ],
};

function transformImports() {
  const muiPackages = ["core", "icons", "lab", "styles"];

  const transform = {};

  for (const muiPackage of muiPackages) {
    transform["@mui/" + muiPackage] = {
      preventFullImport: true,
      transform: `@mui/${muiPackage}/` + "${member}",
    };
  }

  return ["babel-plugin-transform-imports", transform];
}
