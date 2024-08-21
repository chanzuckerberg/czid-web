import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { HeatmapPage } from "@e2e/page-objects/heatmap-page";
import * as fs from "fs/promises";
import { DownloadsPage } from "@e2e/page-objects/downloads-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import fastDiff = require("fast-diff");

import { RR004_WATER_2_S23A_R1, RR004_WATER_2_S23A_R2, SAMPLE1_R1_001, SAMPLE2_R2_001 } from "@e2e/constants/sample";
const OUTPUT_PATH = (outputDir: string, filename: string) => `./fixtures/outputs/${outputDir}/${filename}`;

const UPLOAD_TIMEOUT = 60 * 1000 * 5;
const TEST_TIMEOUT = 60 * 1000 * 60;
const RUN_PIPELINE = false;
const WAIT_FOR_PIPELINE = false;

let heatmapUrl: string
let project: any

const DOWNLOAD_MICROBIOME_COMBINED_CASES = [
  {id: 15, metric: "NT rPM"},
  {id: 16, metric: "NT r (total reads)"},
  {id: 17, metric: "NR rPM"},
  {id: 18, metric: "NR r (total reads)"},
]

test.describe("Functional: P-1: Taxon heatmap - Top Links", () => {
  
  test.beforeAll(async ({browser}) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const projectPage = new ProjectPage(page);
    project = await projectPage.getOrCreateProject("TopLinks");

    // RR004_water_2_s23a_r1
    // RR004_water_2_s23a_r2
    // Sample1_r1_001
    // Sample2_r2_001
    // https://drive.google.com/drive/folders/1qT3rAlcr-VRDUBwehGvos_EYpDTWRQmZ
    await setupSamples(
      page,
      project,
      [RR004_WATER_2_S23A_R1, RR004_WATER_2_S23A_R2],
      ["RR004_water_2_S23A"],
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        hostOrganism: "Human",
        sampleTissueType: "Stool",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
      UPLOAD_TIMEOUT
    )
    await setupSamples(
      page,
      project,
      [SAMPLE1_R1_001, SAMPLE2_R2_001],
      ["Sample1", "Sample2"],
      WORKFLOWS.MNGS,
      {
        runPipeline: RUN_PIPELINE,
        hostOrganism: "Human",
        sampleTissueType: "Stool",
        sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
      UPLOAD_TIMEOUT
    )
    heatmapUrl = await createHeatmap(page, project);
  });

  test.beforeEach(async () => { 
    test.setTimeout(TEST_TIMEOUT);
  });


  for (const c of DOWNLOAD_MICROBIOME_COMBINED_CASES) {
    /**
     * Taxon heatmap - Top Links
     */
    test(`SNo ${c.id}: On Taxon Heatmap: Download Microbiome Combined ${c.metric}`, async ({ page }) => {
      // #region Load A Taxon heat map.
      const heatmapPage = new HeatmapPage(page);
      await heatmapPage.gotoHeatmap(heatmapUrl);
      // #endregion Load A Taxon heat map.

      // #region Click the cloud icon on the top right area
      heatmapPage.clickDownload();
      // #endregion Click the cloud icon on the top right area

      // #region Select combined Microbiome File
      await heatmapPage.clickDownloadType("Combined Microbiome File");
      // #endregion Select combined Microbiome File
  
      // #region On the dropdown select metric
      await heatmapPage.clickDownloadMetric(c.metric);
  
      const downloadId = await heatmapPage.clickStartDownloadButton();
  
      // blue notification at top right corner, with text ""We've received your download request and are busy preparing your data. To check the status of your download, visit the Downloads page.
      // Dismiss"" 
      const notificationMessage = await heatmapPage.getNotificationMessage();
      expect(notificationMessage).toEqual(
        "We've received your download request and are busy preparing your data. " +
        "To check the status of your download, visit the Downloads page." +
        "Dismiss");
  
      // On downloads the item appears.
      const downloadsPage = new DownloadsPage(page);
      await downloadsPage.navigateToDownloads();
  
      const downloadComnpleted = await downloadsPage.waitForDownloadComplete(downloadId, TEST_TIMEOUT);
      expect(downloadComnpleted).toBeTruthy();
  
      // Open The file
      // Compare the file to the original heatmap
      const download = await downloadsPage.clickDownloadFile(downloadId);
      const downloadPath = await download.path();
  
      const downloadFileName = download.suggestedFilename();
      const expectedFileName = "Combined Microbiome File.biom";
      expect(downloadFileName).toEqual(expectedFileName)
  
      // Compare Results vs:
      // Microbiome Combined.biom
      const actualOutputStr = (await fs.readFile(downloadPath)).toString();
      const expectedBaselineStr = (await fs.readFile(OUTPUT_PATH(`heatmap/combined_microbiome_file/${c.metric}`, expectedFileName))).toString();
  
      const expectedMaxDiff = expectedBaselineStr.length * 0.10;
      const actualDiff = fastDiff(actualOutputStr, expectedBaselineStr).length;
      expect(actualDiff).toBeLessThanOrEqual(expectedMaxDiff);
      // #endregion On the dropdown select metric
    });
  }

});

async function createHeatmap(page: any, project: any) {
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS)
    await projectPage.selectCompletedSamples(3);
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    const heatmapId = await heatmapPage.clickSave();
    const heatmapUrl = `https://${process.env.NODE_ENV}.czid.org/visualizations/heatmap/${heatmapId}`
    heatmapPage.close();

    return heatmapUrl;
}