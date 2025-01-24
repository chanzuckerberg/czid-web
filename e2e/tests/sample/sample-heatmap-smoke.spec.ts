import { WORKFLOWS } from "@e2e/constants/common";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

let projectPage = null;
let heatmapPage = null;

let project = null;
let heatmapSamples = null;

const TEST_TIMEOUT = 60 * 1000 * 4;

test.describe("Sample Heatmap", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    projectPage = new ProjectPage(page);

    // #region Go to the Samples tab
    const workflow = WORKFLOWS.MNGS;
    project = await projectPage.getOrCreateProject(
      `automation_project_${workflow}`,
    );
    await projectPage.navigateToSamples(project.id, workflow);
    // #endregion Go to the Samples tab

    // #region Choose samples
    const completedRowIndexes = await projectPage.getCompletedRowIndexes();
    const rowIndex1 = completedRowIndexes[0];
    const rowIndex2 = completedRowIndexes[1];

    const sampleName1 = await projectPage.getSampleNameFromRow(rowIndex1);
    const sampleName2 = await projectPage.getSampleNameFromRow(rowIndex2);
    heatmapSamples = [sampleName1, sampleName2];

    await projectPage.clickSampleCheckbox(sampleName1);
    await projectPage.clickSampleCheckbox(sampleName2);
    // #endregion Choose samples

    // #region Create a Taxon Heatmap
    await projectPage.clickHeatmapButton();
    heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion Create a Taxon Heatmap

    await heatmapPage.dismissAppcuesContainerIfPresent();

    // There should be no warning notification at this point
    // KNOWN ISSUE: https://czi-sci.slack.com/archives/C05NKGCD2E8/p1706897133210019
    await heatmapPage.validateNotificationContainerIsNotPresent();
  });

  /**
   * User is able to create and save a heatmap
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-37
   */
  test(`Smoke Test: User is able to create and save a heatmap`, async () => {
    // #region Validate the heatmap was created for the selected samples
    await heatmapPage.validateHeatmapSampleNames(heatmapSamples);
    // #endregion Validate the heatmap was created for the selected samples

    // #region Validate the heatmap was saved
    await heatmapPage.clickSave();
    const saveConfirmation = await heatmapPage.getSaveConfirmation();
    expect(saveConfirmation).toEqual("Your visualization was saved!");
    // #endregion Validate the heatmap was saved
  });

  /**
   * Verify user is able select the following view options
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-39
   *
   * Taxon Level
   * Metric
   * Sort Samples
   * Sort Taxa
   * Scale
   */
  test(`Smoke Test: Verify user is able select the following view options`, async () => {
    test.setTimeout(60 * 1000 * 5); // This test needs a slightly longer runtime
    // #region Verify the expected view options are visible
    const expectedViewOptions = [
      "Taxon Level",
      "Metric",
      "Sort Samples",
      "Sort Taxa",
      "Scale",
    ];
    const viewOptions = await heatmapPage.getViewOptions();
    expect(viewOptions).toEqual(expectedViewOptions);
    // #endregion Verify the expected view options are visible

    // #region Get the sample reports
    const sampleReports = [];
    const samplesPage = new SamplesPage(heatmapPage.page);
    for (const sample of heatmapSamples) {
      const samples = await samplesPage.getSamples(project.name, sample);
      const report = await samplesPage.getReportV2(samples[0].id);
      sampleReports.push(report);
    }
    // #endregion Get the sample reports

    // #region View by Taxon Level
    const taxonLevels = ["Genus", "Species"];
    for (const taxonLevel of taxonLevels) {
      await heatmapPage.setTaxonLevel(taxonLevel);
      const heatmapTaxonNames = await heatmapPage.getTaxonNames();

      // Get the taxons genus names from the reports
      const expectedTaxonNames = [];
      for (const report of sampleReports) {
        const taxonNames = await samplesPage.getTaxonNamesFromReport(report);
        for (const taxonName of taxonNames["Scientific"]) {
          let expectedTaxonName = taxonName;
          if (taxonLevel === "Genus") {
            expectedTaxonName = taxonName.split(" ")[0];
          }
          if (!expectedTaxonNames.includes(expectedTaxonName)) {
            expectedTaxonNames.push(expectedTaxonName);
          }
        }
      }

      // Verify the heatmap filtered by genus contains the expected names
      for (const heatmapTaxon of heatmapTaxonNames) {
        expect(expectedTaxonNames).toContain(heatmapTaxon);
      }
    }
    // #endregion View by Taxon Level

    // #region View by Metric
    const heatmapMetics = await heatmapPage.getHeatmapMetrics();
    for (const metic of heatmapMetics) {
      await heatmapPage.setMetric(metic);
      const cellsCount = await heatmapPage.getCellsCount();

      for (let i = 0; i < cellsCount; i++) {
        const highlightedMetric = await heatmapPage.getHighlightedMetic(i);
        expect(highlightedMetric["label"]).toEqual(metic);
      }
    }
    // #endregion View by Metric

    // #region View by Sort Samples
    const sortSamples = ["Alphabetical", "Cluster"];
    for (const sort of sortSamples) {
      await heatmapPage.setSortSamples(sort);
      const heatmapSamples = await heatmapPage.getSamplesFromUrl();
      const heatmapSampleNames = heatmapSamples.map(s => s.name);

      const expectedSortedSampleNames = heatmapSampleNames;
      if (sort === "Alphabetical") {
        expectedSortedSampleNames.sort();
      }
      expect(heatmapSampleNames).toEqual(expectedSortedSampleNames);
    }
    // #endregion View by Sort Samples

    // #region View by Sort Taxa
    const sortTaxa = ["Genus", "Cluster"]; // Sort by Genus then Cluster
    const heatmapTaxonNames = await heatmapPage.getTaxonNames();
    for (const sort of sortTaxa) {
      await heatmapPage.setSortTaxa(sort);

      const expectedTaxonNames = heatmapTaxonNames;
      if (sort === "Genus") {
        expectedTaxonNames.sort();
      } // Otherwise not sorted by taxon name
      expect(heatmapTaxonNames).toEqual(expectedTaxonNames);
    }
    // #endregion View by Sort Taxa

    // #region View by Scale
    const scales = ["Lin", "Log"];
    for (const scale of scales) {
      const cellStylesBefore = await heatmapPage.getCellStyles();
      await heatmapPage.setScale(scale);

      const cellStylesAfter = await heatmapPage.getCellStyles();
      // Toggling scales will change the heatmap styles
      expect(cellStylesAfter).not.toEqual(cellStylesBefore);
    }
    // #endregion View by Scale
  });

  /**
   * Verify user is able to zoom using the zoom icon
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-38
   */
  test(`Smoke Test: Verify user is able to zoom using the zoom icon`, async () => {
    // #region Click + to zoom and verify the heatmap window grew
    let widthHeightBefore = await heatmapPage.getHeatmapWidthHeight();
    await heatmapPage.clickZoomButton("+");
    await heatmapPage.pause(1);

    let widthHeightAfter = await heatmapPage.getHeatmapWidthHeight();
    expect(+widthHeightBefore["width"]).toBeLessThan(
      +widthHeightAfter["width"],
    );
    expect(+widthHeightBefore["height"]).toBeLessThan(
      +widthHeightAfter["height"],
    );
    // #endregion Click + to zoom and verify the heatmap window grew

    // #region Click - to zoom-out and verify the heatmap window shrank
    widthHeightBefore = await heatmapPage.getHeatmapWidthHeight();
    await heatmapPage.clickZoomButton("-");
    await heatmapPage.pause(1);

    widthHeightAfter = await heatmapPage.getHeatmapWidthHeight();
    expect(+widthHeightBefore["width"]).toBeGreaterThan(
      +widthHeightAfter["width"],
    );
    expect(+widthHeightBefore["height"]).toBeGreaterThan(
      +widthHeightAfter["height"],
    );
    // #endregion Click - to zoom-out and verify the heatmap window shrank
  });
});
