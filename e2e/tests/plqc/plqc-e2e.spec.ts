import * as fs from "fs/promises";
import * as path from "path";
import { getUpperAndLowerBounds } from "../mngs/mngs-e2e.spec";
import { WORKFLOWS, SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { DownloadsPage } from "@e2e/page-objects/downloads-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import fastDiff = require("fast-diff");
import * as tar from "tar";
import { ProjectPage, SAMPLE_OVERVIEW } from "../../page-objects/project-page";

const OUTPUT_PATH = (outputDir: string, filename: string) =>
  `./fixtures/outputs/${outputDir}/${filename}`;

const TEST_TIMEOUT = 1000 * 60 * 60 * 1;

const RUN_PIPELINE = false;
const WAIT_FOR_PIPELINE = false;

/*
 * PLQC E2E
 */
test.describe("PLQC", () => {
  test("SNo 1: PLQC QA test", async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const project = await projectPage.getOrCreateProject(
      `${WORKFLOWS.MNGS}_PLQC_SNo_1`,
    );
    // #endregion 1. Login to CZ ID staging

    // #region 2. Upload paired sample fastq files for PLQC (see ""Data"") as a Metagenomics, use the configuration:
    // - Platform=Illumina
    // - Host=Human
    // - Tissue=Stool
    // and allow the pipeline to complete
    const SRR27389465 = (
      await setupSamples(
        page,
        project,
        // SRR27389465_R1.fastq.gz: https://drive.google.com/file/d/1SBxhAhKAPTc1ie2I2UMCqRdwm3fzPapq/view?usp=sharing
        ["SRR27389465_R1.fastq.gz", "SRR27389465_R2.fastq.gz"],
        ["SRR27389465"],
        WORKFLOWS.MNGS,
        {
          runPipeline: RUN_PIPELINE,
          hostOrganism: "Human",
          sampleTissueType: "Stool",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: WAIT_FOR_PIPELINE,
        },
      )
    )[0];
    const SRR27389466 = (
      await setupSamples(
        page,
        project,
        // SRR27389466_R1.fastq.gz: https://drive.google.com/file/d/1JHJMHYnr0C_4qBZQdVkpxm7gUfFRYD38/view?usp=sharing
        ["SRR27389466_R1.fastq.gz", "SRR27389466_R2.fastq.gz"],
        ["SRR27389466"],
        WORKFLOWS.MNGS,
        {
          runPipeline: RUN_PIPELINE,
          hostOrganism: "Human",
          sampleTissueType: "Stool",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: WAIT_FOR_PIPELINE,
        },
      )
    )[0];
    const SRR27389467 = (
      await setupSamples(
        page,
        project,
        // SRR27389467_R1.fastq.gz: https://drive.google.com/file/d/1govYq9-KJ9PuC5OFUxCwUFbbG6En1rKm/view?usp=sharing
        ["SRR27389467_R1.fastq.gz", "SRR27389467_R2.fastq.gz"],
        ["SRR27389467"],
        WORKFLOWS.MNGS,
        {
          runPipeline: RUN_PIPELINE,
          hostOrganism: "Human",
          sampleTissueType: "Stool",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: WAIT_FOR_PIPELINE,
        },
      )
    )[0];
    const SRR27389468 = (
      await setupSamples(
        page,
        project,
        // SRR27389468_R1.fastq.gz: https://drive.google.com/file/d/1hlKAo4zSNoYynKlLSKLlRLg1anNKTK-H/view?usp=sharing
        ["SRR27389468_R1.fastq.gz", "SRR27389468_R2.fastq.gz"],
        ["SRR27389468"],
        WORKFLOWS.MNGS,
        {
          runPipeline: RUN_PIPELINE,
          hostOrganism: "Human",
          sampleTissueType: "Stool",
          sequencingPlatform: SEQUENCING_PLATFORMS.MNGS, // Illumina
          waitForPipeline: WAIT_FOR_PIPELINE,
        },
      )
    )[0];
    const sampleNames = [
      SRR27389465.name,
      SRR27389466.name,
      SRR27389467.name,
      SRR27389468.name,
    ];
    await projectPage.waitForSamplesComplete(
      project.id,
      WORKFLOWS.MNGS,
      sampleNames,
      TEST_TIMEOUT,
    );
    // #endregion 2. Upload paired sample fastq files for PLQC (see ""Data"") as a Metagenomics, use the configuration:

    // #region 3. Select ""PLQC"" tab
    for (const sampleName of sampleNames) {
      await projectPage.clickSampleCheckbox(sampleName);
    }
    await projectPage.clickPLQCView();
    // #endregion 3. Select ""PLQC"" tab

    // #region 4. Verify the plot in the main view
    await projectPage.maximizeWindow();
    await projectPage.hoverOverPLQCTotalReadHistogramBar();

    // PLOTS

    // 1. Total Reads
    const totalReadsTooltip = await projectPage.getPLQCHoverTooltip();
    // - Total reads: 18k-20k
    // - Number: 4 samples
    const expectedTotalReadsTooltip = [
      "Total Reads",
      "18k-20k",
      "Number",
      "4 samples",
    ];
    expect(totalReadsTooltip).toEqual(expectedTotalReadsTooltip);

    // 2. Passed QC
    await projectPage.hoverOverPLQCPassedQCBars();
    const passedQCTooltip = await projectPage.getPLQCHoverTooltip();
    // - Passed QC: 80%-90%
    // - Number: 4 samples
    const expectedPassedQCTooltip = [
      "Passed QC",
      "80%-90%",
      "Number",
      "4 samples",
    ];
    expect(passedQCTooltip).toEqual(expectedPassedQCTooltip);

    // 3. Duplicate Compression Ratio
    await projectPage.hoverOverPLQCDuplicateCompressionBars();
    const duplicateCompressionTooltip = await projectPage.getPLQCHoverTooltip();
    // - Ratio number: 1-1.5
    // - Number: 4 samples
    const expectedDuplicateCompressionTooltip = [
      "Ratio Number",
      "1-1.5",
      "Number",
      "4 samples",
    ];
    expect(duplicateCompressionTooltip).toEqual(
      expectedDuplicateCompressionTooltip,
    );

    // 4. Mean Insert Size
    await projectPage.page.mouse.wheel(0, 500);
    await projectPage.hoverOverPLQCMeanInsertSizeBars(0);
    const meanInsertSizeTooltip1 = await projectPage.getPLQCHoverTooltip();
    const expectedMeanInsertSizeTooltip1 = [
      "Base Pairs",
      "100-150",
      "Number",
      "1 sample",
    ];
    // - Base pairs: 100-150
    // - Number: 1 sample
    expect(meanInsertSizeTooltip1).toEqual(expectedMeanInsertSizeTooltip1);

    await projectPage.hoverOverPLQCMeanInsertSizeBars(1);
    const meanInsertSizeTooltip2 = await projectPage.getPLQCHoverTooltip();
    const expectedMeanInsertSizeTooltip2 = [
      "Base Pairs",
      "300-350",
      "Number",
      "2 samples",
    ];
    // - Base pairs: 300-350
    // - Number: 2 samples
    expect(meanInsertSizeTooltip2).toEqual(expectedMeanInsertSizeTooltip2);

    // 5. Reads Lost
    await projectPage.page.mouse.wheel(0, 500);
    const readsLostTable = await projectPage.getReadsLostTable();
    // - SRR27389465
    // - Filter low quality 1902
    // - Filter length 180
    // - Filter low complexity 158
    // - Filter host (Bowtie2) 0
    // - Passed Filters 17760
    // - SRR27389466
    // - Filter low quality 1928
    // - Filter length 152
    // - Filter low complexity 222
    // - Filter host (Bowtie2) 0
    // - Passed Filters 17696
    // - SRR27389467
    // - Filter low quality 2216
    // - Filter length 214
    // - Filter low complexity 186
    // - Filter host (Bowtie2) 60
    // - Passed Filters 17324
    // - SRR27389468
    // - Filter low quality 1894
    // - Filter length 74
    // - Filter low complexity 112
    // - Filter host (Bowtie2) 24
    // - Passed Filters 17896
    const expectedReadsLostTable = [
      {
        ERCC: "222",
        "Filter low quality": "1,900",
        "Filter length": "180",
        "Passed Filters": "17,690",
      },
      {
        ERCC: "186",
        "Filter low quality": "1,930",
        "Filter length": "152",
        "Passed Filters": "17,330",
      },
      {
        ERCC: "112",
        "Filter low quality": "2,210",
        "Filter length": "214",
        "Passed Filters": "17,898",
      },
      {
        ERCC: "158",
        "Filter low quality": "1,892",
        "Passed Filters": "17,760",
      },
    ];
    await expectTableValuesWithinTolerance(
      readsLostTable,
      expectedReadsLostTable,
    );
    // #endregion 4. Verify the plot in the main view

    // #region 5. Verify the specified sample reports against baseline outputs"

    // "Comparing with baseline sample report(s) (older versions reports of the same sample):

    // SAMPLE INFORMATION

    // Sample|Total Reads|Passed Filters|Passed QC|DCR|Mean Insert Size|Subsampled fraction
    // SRR27389468|20,000|17,896|89.48%|89.6%|1.06|313±55|1.00
    // SRR27389467|20,000|17,324|86.62%|86.92%|1.05|320±77|1.00
    // SRR27389466|20,000|17,696|88.48%|88.49%|1.05|141±0|1.00
    // SRR27389465|20,000|17,760|88.8%|88.8%|1.06|1.00"

    // Output
    // https://staging.czid.org/my_data?currentDisplay=plqc&currentTab=samples&mapSidebarTab=samples&projectId=1497&showStats=true&updatedAt=2024-05-28T17%3A23%3A39.809Z&workflow=short-read-mngs
    await projectPage.clickDownloadButton();
    await projectPage.clickDownloadType(SAMPLE_OVERVIEW);
    const downloadId = await projectPage.clickStartGeneratingDownloadButton();

    const downloadPage = new DownloadsPage(page);
    await downloadPage.navigateToDownloads();
    await downloadPage.waitForDownloadComplete(downloadId, TEST_TIMEOUT);
    const download = await downloadPage.clickDownloadFile(downloadId);
    const downloadPath = await download.path();

    const downloadFileName = download.suggestedFilename();
    expect(downloadFileName).toMatch(/\.tar\.gz$/);

    const downloadDirectory = path.dirname(downloadPath);
    const extractPath = path.join(downloadDirectory, `SNo_1_${Date.now()}`);
    await fs.mkdir(extractPath, { recursive: true });
    await tar.x({
      file: downloadPath,
      cwd: extractPath,
    });
    const contentName = (await fs.readdir(extractPath))[0];
    const pathToFile = path.join(extractPath, contentName);
    const actualOutputStr = (await fs.readFile(pathToFile)).toString();
    const expectedBaselineStr = (
      await fs.readFile(OUTPUT_PATH("PLQC/sno1", contentName))
    ).toString();

    const expectedMaxDiff = expectedBaselineStr.length * 0.1;
    const diff = fastDiff(actualOutputStr, expectedBaselineStr);
    expect(diff.length).toBeLessThanOrEqual(expectedMaxDiff);
    // #endregion 5. Verify the specified sample reports against baseline outputs"
  });
});

async function expectTableValuesWithinTolerance(
  actualTable: any,
  expectedTable: any,
) {
  const tableColumns = Object.keys(expectedTable[0]);
  for (let i = 0; i < expectedTable.length; i++) {
    for (const column of tableColumns) {
      if (actualTable[i][column]) {
        const actualValue = +actualTable[i][column].replace(/,/g, "");
        const expectedValue = +expectedTable[i][column].replace(/,/g, "");
        const expectedRange = await getUpperAndLowerBounds(expectedValue);
        expect(actualValue).toBeGreaterThanOrEqual(expectedRange.lowerBound);
        expect(actualValue).toBeLessThanOrEqual(expectedRange.upperBound);
      }
    }
  }
}
