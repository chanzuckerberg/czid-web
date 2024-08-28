import { readFileSync } from "fs";
import { test, expect } from "@playwright/test";
import { SEQUENCING_PLATFORMS, WORKFLOWS } from "@e2e/constants/common";
import { ProjectPage } from "@e2e/page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { BIOM_DOWNLOAD_METRICS, DOWNLOAD_TYPES } from "@e2e/page-objects/heatmap-page";
import { DownloadsPage } from "@e2e/page-objects/downloads-page";

let heatmapPage = null;
let project = null;
let projectPage = null;
let sampleNames = [];

const TEST_TIMEOUT = 60 * 1000 * 5;

// ignore minor differences in heatmap image screenshots in headed vs headless mode
const maxDiffPixelsPng = 21238;
const maxDiffPixelsSvg = 20167;

test.describe("Heatmap downloads", () => {
  test.beforeAll(async ({ browser }) => {
    // #region Setup project
    const page = await browser.newPage();
    projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}_heatmap_downloads`);
    // #endregion Setup project

    // #region Setup samples
    // sample name: RR004_water_2_S23A
    // Original file located at: https://drive.google.com/drive/folders/1j55vKp6ucU6bajqPxwnyp4BUwfy0f6Op
    const RR004_water_2_S23A = (await setupSamples(
      page,
      project,
      ["RR004_water_2_S23A_R1.fastq", "RR004_water_2_S23A_R2.fastq"],
      ["RR004_water_2_S23A"],
      WORKFLOWS.MNGS,
      {
        runPipeline: false,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: false,
      },
    ))[0];

    // sample name: sample
    // Original file located at: https://drive.google.com/drive/folders/1j55vKp6ucU6bajqPxwnyp4BUwfy0f6Op
    const sample = (await setupSamples(
      page,
      project,
      ["sample_R1.fastq", "sample_R2.fastq"],
      ["sample"],
      WORKFLOWS.MNGS,
      {
        runPipeline: false,
        hostOrganism: "Human",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: false,
      },
    ))[0];

    sampleNames = [RR004_water_2_S23A.name, sample.name];
    await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.MNGS, sampleNames);
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

  test("SNo 39: Verify downloaded Combined Microbiome File for metric NT rPM", async ({ page }) => {
    // #region Download Combined Microbiome File for metric NT rPM from heatmap
    const biomDownloadId = await heatmapPage.downloadCombinedMicrobiomeFile(
      BIOM_DOWNLOAD_METRICS.NT_RPM,
    );
    // #endregion Download Combined Microbiome File for metric NT rPM from heatmap

    // #region Wait for bulk download to complete, then download and verify the file
    const expectedDownloadFixtureName = "SNo 39 NT rPM Combined Microbiome File.biom";
    const downloadPageTab = await page.context().newPage();
    const downloadPage = new DownloadsPage(downloadPageTab);
    await downloadPage.combinedMicrobiomeFileDownloadTest(
      biomDownloadId,
      expectedDownloadFixtureName
    );
    // #endregion Wait for bulk download to complete, then download and verify the file
  });

  test("SNo 40: Verify downloaded Combined Microbiome File for metric NT r (Total Reads)", async ({ page }) => {
    // #region Download Combined Microbiome File for metric NT rPM from heatmap
    const biomDownloadId = await heatmapPage.downloadCombinedMicrobiomeFile(
      BIOM_DOWNLOAD_METRICS.NT_R_TOTAL_READS,
    );
    // #endregion Download Combined Microbiome File for metric NT rPM from heatmap

    // #region Wait for bulk download to complete, then download and verify the file
    const expectedDownloadFixtureName = "SNo 40 NT r Combined Microbiome File.biom";
    const downloadPageTab = await page.context().newPage();
    const downloadPage = new DownloadsPage(downloadPageTab);
    await downloadPage.combinedMicrobiomeFileDownloadTest(
      biomDownloadId,
      expectedDownloadFixtureName
    );
    // #endregion Wait for bulk download to complete, then download and verify the file
  });

  test("SNo 41: Verify downloaded Combined Microbiome File for metric NR rPM", async ({ page }) => {
    // #region Download Combined Microbiome File for metric NT rPM from heatmap
    const biomDownloadId = await heatmapPage.downloadCombinedMicrobiomeFile(
      BIOM_DOWNLOAD_METRICS.NR_RPM,
    );
    // #endregion Download Combined Microbiome File for metric NT rPM from heatmap

    // #region Wait for bulk download to complete, then download and verify the file
    const expectedDownloadFixtureName = "SNo 41 NR rPM Combined Microbiome File.biom";
    const downloadPageTab = await page.context().newPage();
    const downloadPage = new DownloadsPage(downloadPageTab);
    await downloadPage.combinedMicrobiomeFileDownloadTest(
      biomDownloadId,
      expectedDownloadFixtureName
    );
    // #endregion Wait for bulk download to complete, then download and verify the file
  });

  test("SNo 42: Verify downloaded Combined Microbiome File for metric NR r (Total Reads)", async ({ page }) => {
    // #region Download Combined Microbiome File for metric NT rPM from heatmap
    const biomDownloadId = await heatmapPage.downloadCombinedMicrobiomeFile(
      BIOM_DOWNLOAD_METRICS.NR_R_TOTAL_READS,
    );
    // #endregion Download Combined Microbiome File for metric NT rPM from heatmap

    // #region Wait for bulk download to complete, then download and verify the file
    const expectedDownloadFixtureName = "SNo 42 NR r Combined Microbiome File.biom";
    const downloadPageTab = await page.context().newPage();
    const downloadPage = new DownloadsPage(downloadPageTab);
    await downloadPage.combinedMicrobiomeFileDownloadTest(
      biomDownloadId,
      expectedDownloadFixtureName
    );
    // #endregion Wait for bulk download to complete, then download and verify the file
  });

  test("SNo 43: Verify downloaded heatmap image png", async ({ page }) => {
    const imageDownloadType = DOWNLOAD_TYPES.PNG_IMAGE;
    // #region Download heatmap png image
    const heatmapImageDownload = await heatmapPage.downloadHeatmapImage(imageDownloadType);
    // #endregion Download heatmap png image

    // #region Inject heatmap image as base 64 and take screenshot
    const heatmapImageDownloadPath = await heatmapImageDownload.path();
    const base64Image = readFileSync(heatmapImageDownloadPath, { encoding: "base64" });
    const newPage = await page.context().newPage();
    await newPage.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <img src="data:image/${imageDownloadType.substring(1)};base64,${base64Image}" alt="Heatmap Image">
      </body>
      </html>
    `);
    await expect(newPage).toHaveScreenshot({ maxDiffPixels: maxDiffPixelsPng });
    // #endregion Inject heatmap image as base 64 and take screenshot
  });

  test("SNo 44: Verify downloaded heatmap image svg", async ({ page }) => {
    const imageDownloadType = DOWNLOAD_TYPES.SVG_IMAGE;
    // #region Download heatmap svg image
    const heatmapImageDownload = await heatmapPage.downloadHeatmapImage(imageDownloadType);
    // #endregion Download heatmap svg image

    // #region Inject heatmap image as base 64 and verify screenshot
    const heatmapImageDownloadPath = await heatmapImageDownload.path();
    const base64Image = readFileSync(heatmapImageDownloadPath, { encoding: "base64" });
    const newPage = await page.context().newPage();
    await newPage.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <img src="data:image/${imageDownloadType.substring(1)}+xml;base64,${base64Image}" alt="Heatmap Image">
      </body>
      </html>
    `);
    await expect(newPage).toHaveScreenshot({ maxDiffPixels: maxDiffPixelsSvg });
    // #endregion Inject heatmap image as base 64 and verify screenshot
  });
});
