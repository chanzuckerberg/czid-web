const tasks = arr => arr.join(" && ");

// use tasks defined in package.json
module.exports = {
  hooks: {
    "pre-commit": tasks(["lint-staged"]),
  },
};
