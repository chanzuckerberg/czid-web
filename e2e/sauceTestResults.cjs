/**
 * This script produces "summary.json" which is used for populating stats in
 * Slack notification message.
 * parses Sauce test results, which are JUnit compliant XML files.
 * Sauce lab produces test one Junit test result file in XML, per test suite. 
 * The script converts each XML file into JSON using "junit2json" package, extracts the relevant stats and then writes
 * the aggregated stats to the output file."
 * The script is invoked by Github works after E2E tests have been executed.
 */
const fs = require("fs");
const { parse } = require("junit2json");

// get all test suites; results have been downloaded from saucelabs and placed in "artifacts" folder
const getFolders = () => {
  let suites = [];
  const baseDir = `${process.cwd()}/artifacts/`;
  const fileList = fs.readdirSync(baseDir);
  for (const file of fileList) {
    const name = `${baseDir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      suites.push(name);
    }
  }
  return suites;
};


const processResults = async () => {
  const jobFolders = getFolders();
  let totalTests = 0;
  let totalFailures = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalTime = 0;
  let status = "passed";

  // loop all test suites and parse the results
  for (const folder of jobFolders) {
    const jsonFile = `${folder}/junit.xml`;
    const jsonResult = fs.readFileSync(jsonFile);
    const output = await parse(jsonResult);

    // increment stats
    totalTests += output.tests;
    totalFailures += output.failures;
    totalSkipped += output.skipped;
    totalErrors += output.errors;
    totalTime += output.time;

    // fail or error whole test if any suite has failed or errored
    if (output.failures > 0) {
      status = "failed";
    }else if (output.errors > 0) {
      status = "error";
    }
  }
  //write result to json
  const results = {
    total: totalTests,
    status: status,
    passed: totalTests,
    failed: totalFailures,
    error: totalErrors,
    skipped: totalSkipped,
    duration: totalTime,
  };
  fs.writeFileSync("summary.json", JSON.stringify(results));
};

processResults();
