import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage, TRIM_PRIMER_FILENAME } from "@e2e/page-objects/upload-page";
import { test, expect } from "@playwright/test";
import AdmZip = require("adm-zip");
import { ProjectPage } from "../../page-objects/project-page";

let ranPipeline = false;
let project = null;
let projectPage = null;

// #region Expected data
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const NO_HOST_1 = "no_host_1";
const NO_HOST_2 = "no_host_2";
const NO_HOST_1_WITHOUT_TRIM_PRIMER = "no_host_1_1";
const NO_HOST_2_WITHOUT_TRIM_PRIMER = "no_host_2_1";
const WGS_SAMPLE_NAMES_WITHOUT_TRIM_PRIMER = [NO_HOST_1_WITHOUT_TRIM_PRIMER, NO_HOST_2_WITHOUT_TRIM_PRIMER];
const WGS_SAMPLE_NAMES = [NO_HOST_1, NO_HOST_2];
// #endregion Expected data


/*
 * Viral CG (WGS) - Report files
 */
test.describe("Viral CG (WGS) - Report files: Data Validation: P-0", () => {

  /**
   * WGS - 28: Viral CG (WGS) - Report files
   */
  test("SNo 30: Compare trim primers files", async ({ page }) => {
    await runPipelineIfNeeded(page, "Test_SNo_30");
    if (!ranPipeline) {
      test.setTimeout(60 * 1000 * 5); // Adjust the test runtime for downloads only
    }
    // #region 1. Upload the same sample with/without Trim Primers file
    projectPage = new ProjectPage(page);
    // #endregion 1. Upload the same sample with/without Trim Primers file

    // #region 2. Download both (.fa) fasta output report files && 3. Open both fasta files and compare its format

    // #region Get the sample ids for each input file
    const samplesWithoutTrimPrimer = [];
    const samplesPage = new SamplesPage(page);
    for (const sampleName of WGS_SAMPLE_NAMES_WITHOUT_TRIM_PRIMER) {
      const samples = await samplesPage.getSamples(project.name, sampleName);
      samplesWithoutTrimPrimer.push(samples[0]);
    }
    const samplesWithTrimPrimer = [];
    for (const sampleName of WGS_SAMPLE_NAMES) {
      const samples = await samplesPage.getSamples(project.name, sampleName);
      samplesWithTrimPrimer.push(samples[0]);
    }
    // #endregion Get the sample ids for each input file

    // #region 3. Open both fasta files and compare its format
    for (const sample of samplesWithTrimPrimer) {
      await samplesPage.navigate(sample.id);
      const download = await samplesPage.clickDownloadAllButton();
      const downloadPath = await download.path();

      const zip = await new AdmZip(downloadPath);
      const zipContents = await zip.getEntries();

      const zippedFileNames = [];
      for (const content of zipContents) {
        zippedFileNames.push(await content.entryName);
      }
      expect(zippedFileNames).toContain(TRIM_PRIMER_FILENAME);
    }

    for (const sample of samplesWithoutTrimPrimer) {
      await samplesPage.navigate(sample.id);
      const download = await samplesPage.clickDownloadAllButton();
      const downloadPath = await download.path();

      const zip = await new AdmZip(downloadPath);
      const zipContents = await zip.getEntries();

      const zippedFileNames = [];
      for (const content of zipContents) {
        zippedFileNames.push(await content.entryName);
      }
      expect(zippedFileNames).not.toContain(TRIM_PRIMER_FILENAME);
    }
    // #endregion 3. Open both fasta files and compare its format

    // #endregion 2. Download both (.fa) fasta output report files && 3. Open both fasta files and compare its format
  });

});

async function runPipelineIfNeeded(page: any, projectName: string) {
  projectPage = new ProjectPage(page);
  project = await projectPage.getOrCreateProject(projectName);
  const samplesPage = new SamplesPage(page);

  // #region Trim Primer WGS Samples
  let samples1 = [];
  let ranPipeline1 = false;
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
    samples1 = await samplesPage.getSamples(project.name, NO_HOST_2);
    ranPipeline1 = true;
  }
  // #endregion Trim Primer WGS Samples

  // #region Non-Trim Primer WGS Samples
  let samples2 = [];
  let ranPipeline2 = false;
  const noHostSamples1WithoutTrimPrimer = await samplesPage.getSamples(project.name, NO_HOST_1_WITHOUT_TRIM_PRIMER);
  const noHostSamples2WithoutTrimPrimer = await samplesPage.getSamples(project.name, NO_HOST_2_WITHOUT_TRIM_PRIMER);
  if (noHostSamples1WithoutTrimPrimer.length <= 0 && noHostSamples2WithoutTrimPrimer.length <= 0) {
    test.setTimeout(60 * 1000 * 20); // Inclease the test runtime to let the piepline run

    const uploadPage = new UploadPage(page);
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, WGS_SAMPLE_NAMES_WITHOUT_TRIM_PRIMER);
    for (const sampleName of WGS_SAMPLE_NAMES_WITHOUT_TRIM_PRIMER) {
      inputs[sampleName].hostOrganism = "Human";
    }
    await uploadPage.e2eCSVSampleUpload(WGS_SAMPLE_FILES, project, WORKFLOWS.WGS, inputs, false);
    samples2 = await samplesPage.getSamples(project.name, NO_HOST_2_WITHOUT_TRIM_PRIMER);
    ranPipeline2 = true;
  }
  // #endregion Non-Trim Primer WGS Samples

  if (ranPipeline1) {
    await samplesPage.waitForReportComplete(samples1[0].id); // Wait for the last report to finish
  }
  if (ranPipeline2) {
    await samplesPage.waitForReportComplete(samples2[0].id); // Wait for the last report to finish
  }
  if (ranPipeline1 && ranPipeline2) {
    ranPipeline = true;
  }
}