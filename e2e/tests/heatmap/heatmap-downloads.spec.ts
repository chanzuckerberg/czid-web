import * as fs from "fs/promises";
import diff from "fast-diff";
import { test, expect } from "@playwright/test";
import { SEQUENCING_PLATFORMS, WORKFLOWS } from "@e2e/constants/common";
import { ProjectPage } from "@e2e/page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import {
  BIOM_DOWNLOAD_METRICS,
  DOWNLOAD_TYPES,
} from "@e2e/page-objects/heatmap-page";
import {
  COMBINED_MICROBIOME_FILE_NAME,
  DownloadsPage,
} from "@e2e/page-objects/downloads-page";
import {
  RR004_WATER_2_S23A_R1,
  RR004_WATER_2_S23A_R2,
  RR004_WATER_2_S23A_SAMPLE_NAME,
} from "@e2e/constants/sample";

let heatmapPage = null;
let project = null;
let projectPage = null;
let sampleNames = [];

const TEST_TIMEOUT = 60 * 1000 * 5;
const RUN_PIPELINE = false;
const WAIT_FOR_PIPELINE = false;

const COMBINED_MICROBIOME_OUTPUT_FIXTURE_PATH =
  "fixtures/outputs/heatmap/combined_microbiome_file";
const combinedMicrobiomeFileFixtureOutputPath = (
  metric: string,
  snoID = null,
): string => {
  const fileName = `SNo ${snoID} ${COMBINED_MICROBIOME_FILE_NAME}`;
  return `${COMBINED_MICROBIOME_OUTPUT_FIXTURE_PATH}/${metric}/${fileName}`;
};

// Based on observations from running tests locally and in staging envs
const MAX_DIFF_FOR_BIOM_FILE = 700;

test.describe("Heatmap downloads", () => {
  test.beforeAll(async ({ browser }) => {
    // #region Setup project
    const page = await browser.newPage();
    projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(
      `automation_project_${WORKFLOWS.MNGS}_heatmap_downloads`,
    );
    // #endregion Setup project

    // #region Setup samples
    // sample name: RR004_water_2_S23A
    // Original file located at: https://drive.google.com/drive/folders/1j55vKp6ucU6bajqPxwnyp4BUwfy0f6Op
    const RR004_water_2_S23A = (
      await setupSamples(
        page,
        project,
        [RR004_WATER_2_S23A_R1, RR004_WATER_2_S23A_R2],
        [RR004_WATER_2_S23A_SAMPLE_NAME],
        WORKFLOWS.MNGS,
        {
          runPipeline: RUN_PIPELINE,
          collectionLocation: "New York",
          hostOrganism: "Human",
          sampleTissueType: "Stool",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: WAIT_FOR_PIPELINE,
        },
      )
    )[0];

    // sample name: sample
    // Original file located at: https://drive.google.com/drive/folders/1j55vKp6ucU6bajqPxwnyp4BUwfy0f6Op
    const sample = (
      await setupSamples(
        page,
        project,
        ["sample_R1.fastq", "sample_R2.fastq"],
        ["sample"],
        WORKFLOWS.MNGS,
        {
          runPipeline: RUN_PIPELINE,
          collectionLocation: "Los Angeles",
          hostOrganism: "Human",
          sampleTissueType: "Stool",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: WAIT_FOR_PIPELINE,
        },
      )
    )[0];

    sampleNames = [RR004_water_2_S23A.name, sample.name];
    await projectPage.waitForSamplesComplete(
      project.id,
      WORKFLOWS.MNGS,
      sampleNames,
    );
    // #endregion Setup samples
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    // #region Navigate to samples list in project and select all samples
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);

    for (const sampleName of sampleNames) {
      await projectPage.clickSampleCheckbox(sampleName);
    }
    // #endregion Navigate to samples list in project and select all samples

    // #region Create a heatmap
    await projectPage.clickHeatmapButton();
    heatmapPage = await projectPage.clickTaxonHeatmap();
    await heatmapPage.dismissAppcuesContainerIfPresent();
    // #endregion Create a heatmap

    // #region Click on Download Button to open the download modal
    await heatmapPage.clickDownloadButton();
    // #endregion Click on Download Button to open the download modal
  });

  const DOWNLOAD_COMBINED_MICROBIOME_FILE_CASES = [
    { snoId: 39, metric: BIOM_DOWNLOAD_METRICS.NT_RPM },
    { snoId: 40, metric: BIOM_DOWNLOAD_METRICS.NT_R_TOTAL_READS },
    { snoId: 41, metric: BIOM_DOWNLOAD_METRICS.NR_RPM },
    { snoId: 42, metric: BIOM_DOWNLOAD_METRICS.NR_R_TOTAL_READS },
  ];

  for (const c of DOWNLOAD_COMBINED_MICROBIOME_FILE_CASES) {
    test(`SNo ${c.snoId}: On Taxon Heatmap: Download Combined Microbiome File for ${c.metric}`, async ({
      page,
    }) => {
      // #region Download Combined Microbiome File for metric NT rPM from heatmap
      const biomDownloadId = await heatmapPage.downloadCombinedMicrobiomeFile(
        c.metric,
      );
      // #endregion Download Combined Microbiome File for metric NT rPM from heatmap

      // #region Wait for bulk download to complete and download file
      const downloadPageTab = await page.context().newPage();
      const downloadPage = new DownloadsPage(downloadPageTab);
      const downloadPath =
        await downloadPage.downloadCombinedMicrobiomeFileDownload(
          biomDownloadId,
        );
      // #endregion Wait for bulk download to complete, then download and verify the file

      // #region Verify downloaded file against fixture
      const downloadedFileStr = (await fs.readFile(downloadPath)).toString();

      const expectedDownloadFixturePath =
        combinedMicrobiomeFileFixtureOutputPath(c.metric, c.snoId);
      const expectedDownloadFileStr = (
        await fs.readFile(expectedDownloadFixturePath)
      ).toString();

      const downloadedFileDiff = diff(
        downloadedFileStr,
        expectedDownloadFileStr,
      ).length;
      expect(downloadedFileDiff).toBeLessThanOrEqual(MAX_DIFF_FOR_BIOM_FILE);
      // #endregion Verify downloaded file against fixture
    });
  }

  test("SNo 43: Verify downloaded heatmap image png", async () => {
    const imageDownloadType = DOWNLOAD_TYPES.PNG_IMAGE;
    // #region Download heatmap png image
    const heatmapImageDownload = await heatmapPage.downloadHeatmapImage(
      imageDownloadType,
    );

    const heatmapImageDownloadPath = await heatmapImageDownload.path();
    expect(heatmapImageDownloadPath).toBeTruthy();
    // #endregion Download heatmap png image
  });

  test("SNo 44: Verify downloaded heatmap image svg", async () => {
    const imageDownloadType = DOWNLOAD_TYPES.SVG_IMAGE;
    // #region Download heatmap svg image
    const heatmapImageDownload = await heatmapPage.downloadHeatmapImage(
      imageDownloadType,
    );

    const heatmapImageDownloadPath = await heatmapImageDownload.path();
    expect(heatmapImageDownloadPath).toBeTruthy();
    // #endregion Download heatmap svg image
  });
});
