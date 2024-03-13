import * as fs from "fs/promises";
import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage, SARS_COV2_REF_FILENAME, SARS_COV2_TRIM_PRIMER_FILENAME } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import AdmZip = require("adm-zip");
import { ProjectPage } from "../../page-objects/project-page";

let project = null;
let projectPage = null;

// #region Expected data
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const NO_HOST_1 = "no_host_1";
const NO_HOST_2 = "no_host_2";
const WGS_SAMPLE_NAMES = [NO_HOST_1, NO_HOST_2];
// #endregion Expected data


/*
 * WGS - Sample report
 */
test.describe("Data Validation: P-0", () => {

  test("SNo 29: Customer Reference file download and format", async ({ page }) => {
    await runPipelineIfNeeded(page, "Test_SNo_29");

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    await projectPage.getProjectByName(project.name);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Open a CG sample report
    const samplesPage = new SamplesPage(page);
    const samples = await samplesPage.getSamples(project.name, NO_HOST_1);
    const sampleId = samples[0].id;
    await samplesPage.navigate(sampleId);
    // #endregion 3. Open a CG sample report

    // #region 4. Click on Custom Reference Download button
    const download = await samplesPage.clickCustomReferenceDownload();
    // #endregion 4. Click on Custom Reference Download button

    // #region 5. Save (.fa) file
    // Custom Reference download button works (.fa) file downloaded)
    const actualFileName = download.suggestedFilename();
    expect(actualFileName).toMatch(/\.fa$/);
    // #endregion 5. Save (.fa) file

    // #region 6. Open the fasta file (notepad suggested) and observe data displayed
    const downloadPath = await download.path();
    const fileContent = fs.readFile(downloadPath, {encoding: "utf-8"});
    const lines = (await fileContent).split(/\r?\n/);

    // - First row displays >{ID}_{Description} in text format
    const fistLine = lines.shift();
    expect(fistLine).toMatch(/^>[A-Za-z0-9]+_[\S ]+$/);

    const lastLine = lines[lines.length-1];
    if (lastLine.trim() === "") {
      lines.pop(); // Remove the last empty line
    }
    // There should be at least 1 line, minus the first ">{ID}_{Description}" line and last empty line
    expect(lines.length).toBeGreaterThanOrEqual(1);

    // - Sequences displayed in ACGTN chain character format
    for (const line of lines) {
      expect(line).toMatch(/^[ACGTNRYKMSWBDHV]+$/); // https://en.wikipedia.org/wiki/FASTA_format
    }
    // #endregion 6. Open the fasta file (notepad suggested) and observe data displayed
  });

});

async function runPipelineIfNeeded(page: any, projectName: string) {
  projectPage = new ProjectPage(page);
  project = await projectPage.getOrCreateProject(projectName);
  const samplesPage = new SamplesPage(page);
  // #region Trim Primer WGS Samples
  let samples = [];
  let ranPipeline = false;
  const noHostSamples1 = await samplesPage.getSamples(project.name, NO_HOST_1);
  const noHostSamples2 = await samplesPage.getSamples(project.name, NO_HOST_2);
  if (noHostSamples1.length <= 0 && noHostSamples2.length <= 0) {
    test.setTimeout(60 * 1000 * 20); // Inclease the test runtime to let the piepline run

    const uploadPage = new UploadPage(page);
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, WGS_SAMPLE_NAMES);
    for (const sampleName of WGS_SAMPLE_NAMES) {
      inputs[sampleName].hostOrganism = "Human";
    }
    await uploadPage.e2eCSVSampleUpload(WGS_SAMPLE_FILES, project, WORKFLOWS.WGS, inputs, true);
    samples = await samplesPage.getSamples(project.name, NO_HOST_2);
    ranPipeline = true;
  }
  if (ranPipeline) {
    await samplesPage.waitForReportComplete(samples[0].id); // Wait for the last report to finish
  }
  // #endregion Trim Primer WGS Samples
}