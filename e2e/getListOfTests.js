/**
 * This script generates the list of E2E test cases and writes to a CSV file "testcases.csv".
 * It looks in the e2e/tests directory and resursively parses every spec file
 * usage: cd e2e && node getListOfTests.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import lineReader from "line-reader";

const baseDir = "tests";
const fileName = "testcases.csv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testPatterns = ["test", "test.skip", "test.fixme"];

// remove existing file
if(fs.existsSync(fileName)){
  fs.unlinkSync(fileName);
}


// create output file and write header
const testcaseFile = fs.createWriteStream(fileName, { flags: "a" });
testcaseFile.write("suite,test case,skipped\n");

// extracts any line that stats with "test", recursively looping subfolders
const getAllSpecs = function(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllSpecs(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
    }
  });

  return arrayOfFiles;
};

const getTestSuite = function(line){
  let suiteName;
  // suites start with "test.describe"
  if (line.includes("test.describe(")) {
    suiteName = line
      .split('"')[1]
      .replace("tests", "")
      .replace("test", "")
      .trim();
  }
  return suiteName;
};

const getTestName = function(line){
  let testName;
  // tests start with "test(", "test.skip", "test.fixme"
  const lineStart = line.split("(")[0].trim();
  if (testPatterns.includes(lineStart)) {
    testName = line.split('"')[1];
    if (testName === undefined) {
      testName = line.split("`")[1];
    }
  }
  return testName;
};

const getTestStatus = function(line){
  // inactive tests are marked as "test.skipped" or "test.fixme"
  if (line.includes("test.skip") || line.includes("test.fixme")) {
    return true;
  }
  return false;
};

// process the list of tests, separating suites from ordinary tests
async function extractTests() {
  const specFiles = await getAllSpecs(baseDir, []);
  // const testPatterns = ["test", "test.skip", "test.fixme"];
  specFiles.forEach(specFile => {
    let suite = "";
    lineReader.eachLine(specFile, function(line) {
      const strLine = String(line).trim();

      // update suite name
      const newSuite = getTestSuite(strLine);
      suite = newSuite !== undefined ? newSuite : suite;

      // get test name
      const testName = getTestName(strLine);

      // get test status
      const status = getTestStatus(strLine);

      // write test case to file, together with suite and status information
      if (testName !== "" && testName !== undefined) {
        // clean up variablized test names
        const testcase = testName.replace(/{(.*?)}/g, "").replace("$ ", "");
        const outputStr = `${suite},${String(testcase).trim()},${status}\n`;
        testcaseFile.write(outputStr);
      }
    });
  });
}

extractTests();
