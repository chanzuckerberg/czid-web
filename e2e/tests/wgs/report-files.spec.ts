import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { TRIM_PRIMER_FILENAME } from "@e2e/page-objects/upload-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import AdmZip = require("adm-zip");
import { ProjectPage } from "../../page-objects/project-page";

// #region Expected data
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const NO_HOST = "wgs_SARS_CoV2_no_host";
const NO_HOST_WITHOUT_TRIM_PRIMER = "wgs_SARS_CoV2_no_host_1";
const WGS_SAMPLE_NAMES_WITHOUT_TRIM_PRIMER = [NO_HOST_WITHOUT_TRIM_PRIMER];
const WGS_SAMPLE_NAMES = [NO_HOST];
// #endregion Expected data

/*
 * Viral CG (WGS) - Report files
 */
test.describe("Viral CG (WGS) - Report files: Data Validation: P-0", () => {
  /**
   * WGS - 28: Viral CG (WGS) - Report files
   */
  test("SNo 30: Compare trim primers files", async ({ page }) => {
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject("Test_SNo_30");
    // #region 1. Upload the same sample with/without Trim Primers file
    await projectPage.deleteSamplesOlderThanGivenMonths(
      project,
      WORKFLOWS.WGS,
      5,
    );
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      { includeTrimPrimer: true, waitForPipeline: true },
    );
    await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES_WITHOUT_TRIM_PRIMER,
      WORKFLOWS.WGS,
      { includeTrimPrimer: false, waitForPipeline: true },
    );
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
