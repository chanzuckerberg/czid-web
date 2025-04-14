import * as fs from "fs/promises";
import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";
import { ProjectPage } from "@e2e/page-objects/project-page";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";

// #region Expected data
const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const WGS_SAMPLE_NAMES = ["wgs_SARS_CoV2_no_host"];
// #endregion Expected data

/*
 * WGS - Sample report
 */
test.describe("Data Validation: P-0", () => {
  test("SNo 29: Customer Reference file download and format", async ({
    page,
  }) => {
    const projectPage = new ProjectPage(page);
    const project = await new ProjectPage(page).getOrCreateProject(
      "Test_SNo_29",
    );
    await projectPage.deleteSamplesOlderThanGivenMonths(
      project,
      WORKFLOWS.WGS,
      5,
    );
    const samples = await setupSamples(
      page,
      project,
      WGS_SAMPLE_FILES,
      WGS_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      { runPipeline: false, waitForPipeline: true },
    );

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Pick a project with WGS samples
    await projectPage.getProjectByName(project.name);
    // #endregion 2. Pick a project with WGS samples

    // #region 3. Open a CG sample report
    const samplesPage = new SamplesPage(page);
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
    const fileContent = fs.readFile(downloadPath, { encoding: "utf-8" });
    const lines = (await fileContent).split(/\r?\n/);

    // - First row displays >{ID}_{Description} in text format
    const fistLine = lines.shift();
    expect(fistLine).toMatch(/^>[A-Za-z0-9]+_[\S ]+$/);

    const lastLine = lines[lines.length - 1];
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
