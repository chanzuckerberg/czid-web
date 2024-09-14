import { spawn } from "child_process";
import * as fs from "fs";
import * as yaml from "js-yaml";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const NODE_ENV = "local";
const LOCAL_CONFIG = "./setup/local.config.ts";

interface TestSuite {
  testMatch: string[];  // Assuming it's an array of strings
  params: {
    grep?: string;
    retries?: number;
  };
}

interface TestConfig {
  suites: TestSuite[];
}

// Parse test-type command line argument
const argv = yargs(hideBin(process.argv))
  .option("test-type", {
    alias: "t",
    describe: "Specify the test type to run",
    choices: ["smoke", "e2e"], // Allowed values
    default: "smoke",
    type: "string"
  })
  .help()
  .argv;


// Load and parse the YAML file
const testType = argv["test-type"];
const testConfigfile = `.sauce/${testType}.yml`;
let testConfig: TestConfig = null;

try {
  const fileContents = fs.readFileSync(testConfigfile, "utf8");
  testConfig = yaml.load(fileContents) as TestConfig;
} catch (error) {
  console.error(`Failed to load YAML file: ${error.message}`);
  process.exit(1);  // Exit early if reading the file fails
}

// Verify test config has expected format
if (testConfig?.suites === undefined) {
  console.error("Invalid YAML structure");
  process.exit(1);  // Exit early if the YAML structure is invalid
}

const runTestSuite = async (suite: TestSuite) => {
  const testFile = suite.testMatch[0];
  const grep = suite.params?.grep;
  const retries = suite.params?.retries;

  const command = "npx";

  const args = [
      "playwright",
      "test",
      testFile,
      "-c", LOCAL_CONFIG,
  ];

  if (grep) {
    args.push("-g", grep);
  }

  if (retries) {
    args.push("--retries", retries.toString());
  }

  // Print command to console
  const commandToDisplay = `NODE_ENV=${NODE_ENV} ${command}`

  // The displayed command should quote the value passed to -g flag for easier reusability,
  // but passing quoted argument values to `spawn` does not run the command correctly.
  const argsToDisplay = args.map((arg, index) => (
    args[index - 1] === "-g" ? `"${arg}"` : arg
  )).join(" ");

  // eslint-disable-next-line no-console
  console.info(`${commandToDisplay} ${argsToDisplay}`);

  // Wrap spawn in a promise to use async/await
  return new Promise<void>((resolve) => {
    // Use spawn to see real time output
    const childProcess = spawn(command, args, {
      env: { ...process.env, NODE_ENV },  // Set NODE_ENV in the environment
      stdio: "inherit"  // Inherit stdio to see real-time output
    });

    childProcess.on("close", () => { resolve(); });
  });
};

const runTests = async () => {
  const testSuites = testConfig.suites;
  for (const suite of testSuites) {
    await runTestSuite(suite);
  }
};

runTests();
