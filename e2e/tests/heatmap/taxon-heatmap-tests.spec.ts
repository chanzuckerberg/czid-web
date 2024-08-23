import { WORKFLOWS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";
import { HeatmapPage } from "@e2e/page-objects/heatmap-page";
import * as fs from "fs/promises";
import { DownloadsPage } from "@e2e/page-objects/downloads-page";


const TEST_TIMEOUT = 60 * 1000 * 60;
const NONE = "None";

test.describe("Functional: P-0: Taxon heatmap - 1", () => {
  test.beforeEach(async () => {
    test.setTimeout(TEST_TIMEOUT);
  });

  /**
   * Taxon heatmap - Filtering
   * Removal
   */
  test(`SNo 1: Threshold filtering criteria removal`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const heatmapUrl = await createHeatmap(projectPage);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Visualization tab
    await projectPage.clickVisualizationsTab();
    // #endregion 2. Click on Visualization tab

    // #region 3. Click on an "Heatmap sp961" record in Visualization list
    const heatmapPage = new HeatmapPage(page);
    await heatmapPage.gotoHeatmap(heatmapUrl);
    // #endregion 3. Click on an "Heatmap sp961" record in Visualization list

    // #region 4. Click on Thresholds filter at Filters left panel
    const vizCellsBefore = await heatmapPage.getCellsCount();
    // #endregion 4. Click on Thresholds filter at Filters left panel

    // #region 5. Pick more than 2 different Threshold filters, enter values, and click on apply
    await heatmapPage.setThresholdsOptions([
      {
        metric: "NT rPM",
        value: "5000"
      },
      {
        metric: "NR rPM",
        value: "1000"
      }
    ]);
    // #endregion 5. Pick more than 2 different Threshold filters, enter values, and click on apply

    // #region 6. Verify heatmap refreshes with filtering criteria
    const vizCellsAfter = await heatmapPage.getCellsCount();

    // - Threshold filtering applied to Taxon Heatmap
    expect(vizCellsBefore).toBeGreaterThan(vizCellsAfter);
    // #endregion 6. Verify heatmap refreshes with filtering criteria

    // #region 7. Remove thresholds chosen in step 5 randomly (clicking on x)
    await heatmapPage.clickRemoveFilterButton();
    await heatmapPage.clickRemoveFilterButton();

    // allow heatmap to update - there is sometimes another alert, so do not delay closing the background alert
    await heatmapPage.pause(2);

    // - Threshold filtering removed when clicking x
    expect(vizCellsAfter).toBeLessThanOrEqual(await heatmapPage.getCellsCount());
    // #endregion 7. Remove thresholds chosen in step 5 randomly (clicking on x)

    // #region 8. Verify heatmap refreshes to its original state

    // Taxon heatmap visualization:
    // - Refreshes when filtering criteria added / removed
    // - Comes back to its original state when no filtering applied"
    expect(vizCellsBefore).toEqual(await heatmapPage.getCellsCount());
    // #endregion 8. Verify heatmap refreshes to its original state
  });

  /**
   * Taxon heatmap - Creation
   * Default BG None
   */
  test(`SNo 2: Default value in a new Taxon heatmap`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select or Create a Project. Example ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select or Create a Project. Example ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();

    // - New Taxon Heatmap opens in a new tab
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();

    // - Default Background Model value is None for newly created Taxon Heatmap
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""
  });

  /**
   * Taxon heatmap - Creation
   * None BG filtering UI
   */
  test(`SNo 3: Taxon heatmap NT / NR Z score filtering with None BG`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select or Create a Project. Example ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select or Create a Project. Example ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""

    // #region 6. Click on View Options > Metric option and verify NT / NR Z score options are disabled
    const disabledMetricOptions = ["NT Z Score", "NR Z Score"];
    const metricOptions = await heatmapPage.getMetricOptions();
    for (const disabledOption of disabledMetricOptions) {
      expect(metricOptions).not.toContain(disabledOption);
    }
    // #endregion 6. Click on View Options > Metric option and verify NT / NR Z score options are disabled

    // #region 7. Hover over NT / NR Z score options in Metric drowpdown and verify tooltip is displayed

    // - NT / NR Z Score options displayed and disabled in View Options > Metric
    // - Tooltip displayed while hovering NT / NR Z Score disabled metric options:
    // To see the Z Score, first choose a background model above. Learn more (link)
    const expectedZScoreTooltip = "To see the Z Score, first choose a background model above. Learn more.";
    const ntZScore = await heatmapPage.getMetricOptionTooltip('NT Z Score');
    expect(ntZScore).toEqual(expectedZScoreTooltip);

    const nrZScore = await heatmapPage.getMetricOptionTooltip('NR Z Score');
    expect(nrZScore).toEqual(expectedZScoreTooltip);
    // #endregion 7. Hover over NT / NR Z score options in Metric drowpdown and verify tooltip is displayed

    // #region 8. Click Filters > Thresholds option and click on first row dropdown list
    const thresholdsOptions = await heatmapPage.getThresholdsOptions();
    // #endregion 8. Click Filters > Thresholds option and click on first row dropdown list

    // #region 9. Verify NT / NR Z score are displayed and disabled

    // - NT / NR Z Score options displayed and disabled in Filters > Thresholds
    for (const disabledOption of disabledMetricOptions) {
      expect(thresholdsOptions).not.toContain(disabledOption);
    }
    // #endregion 9. Verify NT / NR Z score are displayed and disabled

    // #region 10. Hover over NT / NR Z score options in a Threshold drowpdown and verify tooltip is displayed

    // - Tooltip displayed while hovering NT / NR Z Score disabled threshold options:
    // To see the Z Score, first choose a background model above. Learn more (link)
    const filterNtZScore = await heatmapPage.getThresholdOptionTooptip('NT Z Score');
    expect(filterNtZScore).toEqual(expectedZScoreTooltip);

    const filterNrZScore = await heatmapPage.getThresholdOptionTooptip('NR Z Score');
    expect(filterNrZScore).toEqual(expectedZScoreTooltip);
    // #endregion 10. Hover over NT / NR Z score options in a Threshold drowpdown and verify tooltip is displayed

    // #region 11. Click cancel and hover over a Taxon Heatmap cell with data
    await heatmapPage.hoverOverCell(0);
    // #endregion 11. Click cancel and hover over a Taxon Heatmap cell with data

    // #region 12. Verify NT / NR Z score values
    const heatmapTooltip = await heatmapPage.getHeatmapTooltipText();

    // - Taxon heatmap cells displayed NT / NR Z score as ""-""
    expect(heatmapTooltip).toContain("NT Z Score-")
    expect(heatmapTooltip).toContain("NR Z Score-")
    // #endregion 12. Verify NT / NR Z score values

    // #region 13. While hovering over a cell with data, click on the cell
    const samplesPage = await heatmapPage.clickCell(0);

    // - Sample report Z Score column values displayed as ""-""
    const reportTable = await samplesPage.getReportFilterTable();
    for (const taxon of reportTable) {
      expect(taxon['Z Score']).toEqual("-");
    }
    // #endregion 13. While hovering over a cell with data, click on the cell

    // #region 14. Verify Sample report background persists as ""None""

    // - Sample report opens in a new tab and default BG model is None
    expect(await samplesPage.getBackgroundFilterValue()).toEqual(NONE);
    // #endregion 14. Verify Sample report background persists as ""None""

    // #region 15. Go back to Taxon heatmap and click on Filters > Thresholds
    await samplesPage.close();
    // #endregion 15. Go back to Taxon heatmap and click on Filters > Thresholds

    // #region 16. Add thresholds NT rPM & NR rPM, enter values and click apply
    const cellsBefore = await heatmapPage.getCellsCount();

    // - Thresholds filters work (other than disabled NT / NR Z Score)
    // - Metric view options work (other than disabled NT / NR Z Score)
    await heatmapPage.setThresholdsOptions([
      {
        metric: "NT rPM",
        value: "5000"
      },
      {
        metric: "NR rPM",
        value: "1000"
      }
    ]);
    // #endregion 16. Add thresholds NT rPM & NR rPM, enter values and click apply

    // #region 17. Verify Taxon Heatmap data refreshes
    const cellsAfter = await heatmapPage.getCellsCount();

    expect(cellsAfter).toBeLessThan(cellsBefore);
    // #endregion 17. Verify Taxon Heatmap data refreshes

    // #region 18. Click on  View Options > Metric option and choose NR rPM
    const highlightedMeticBefore = await heatmapPage.getHighlightedMetic(0);
    await heatmapPage.setMetric("NR rPM")
    // #endregion 18. Click on  View Options > Metric option and choose NR rPM

    // #region 19. Verify Taxon Heatmap data refreshes
    const highlightedMeticAfter = await heatmapPage.getHighlightedMetic(0);

    expect(highlightedMeticBefore.label).not.toEqual(highlightedMeticAfter.label)
    // #endregion 19. Verify Taxon Heatmap data refreshes

    // #region 20. Hover over a Taxon Hetmap cell with data and verify Nr rPM label is bold
    expect(highlightedMeticAfter.label).toEqual("NR rPM");
    // #endregion 20. Hover over a Taxon Hetmap cell with data and verify Nr rPM label is bold
  });

});

test.describe("Functional: P-0: Taxon heatmap - 2", () => {

  test.beforeEach(async () => {
    test.setTimeout(TEST_TIMEOUT);
  });

  /**
   * Taxon heatmap - BG model persistance
   */
  test(`SNo 4: Saved Taxon Heatmap behavior when BG model chosen`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select or Create a Project. Example ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select or Create a Project. Example ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();
    let heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""

    // #region 6. Click on Background dropdown list and pick ""floo sp97"" option
    const backgrounds = await heatmapPage.getBackgrounds();
    const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(background);
    // #endregion 6. Click on Background dropdown list and pick ""floo sp97"" option

    // #region 7. Close ""We're busy generating your heatmap with a new background model. It may take a couple of minutes to load"" toast message
    const alertMessage = await heatmapPage.getAlertMessage();
    expect(alertMessage).toEqual(
      "We're busy generating your heatmap with a new background model. It may take a couple of minutes to load.");

    // 7. Click on Save Button
    await heatmapPage.clickCloseAlertButton();
    // allow heatmap to update
    await heatmapPage.pause(2);
    const heatmapId = await heatmapPage.clickSave();

    // - ""Your visualization was saved!"" message displayed when clicking on Save
    const saveNotification = await heatmapPage.getSaveNotification();
    expect(saveNotification).toEqual("Your visualization was saved!")
    // #endregion 7. Close ""We're busy generating your heatmap with a new background model. It may take a couple of minutes to load"" toast message

    // #region 8. Close Taxon Heatmap tab, and go back to Discovery View My Data page and click on Visualization tab
    const heatmapUrl = `https://${process.env.NODE_ENV}.czid.org/visualizations/heatmap/${heatmapId}`
    await heatmapPage.close();
    // #endregion 8. Close Taxon Heatmap tab, and go back to Discovery View My Data page and click on Visualization tab

    // #region 9. Click on latest ""Heatmap"" record
    await projectPage.navigateToMyData();
    await projectPage.clickVisualizationsTab();

    // - New Taxon Heatmap saves in Visualization records
    heatmapPage = new HeatmapPage(page);
    await heatmapPage.gotoHeatmap(heatmapUrl);
    // #endregion 9. Click on latest ""Heatmap"" record

    // #region 10. Verify Filters > Background value
    const backgroundValue = await heatmapPage.getSelectedBackground();

    // - Background ""floo sp97"" value persists"
    expect(backgroundValue).toEqual(background);
    // #endregion 10. Verify Filters > Background value
  });

  /**
   * Taxon heatmap - BG model persistance
   * Selecting None BG back
   */
  test(`SNo 5: Saved Taxon Heatmap behavior when BG model chosen back to None`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select or Create a Project. Example ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select or Create a Project. Example ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();
    let heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""

    // #region 6. Click on Background dropdown list and pick ""floo sp97"" option
    const backgrounds = await heatmapPage.getBackgrounds();
    const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(background);
    // #endregion 6. Click on Background dropdown list and pick ""floo sp97"" option

    // #region 7. Close ""We're busy generating your heatmap with a new background model. It may take a couple of minutes to load"" toast message
    const alertMessage = await heatmapPage.getAlertMessage();
    expect(alertMessage).toEqual(
      "We're busy generating your heatmap with a new background model. It may take a couple of minutes to load.");

    let backgroundValue = await heatmapPage.getSelectedBackground();
    expect(backgroundValue).toEqual(background);

    // 7. Click on Save Button
    await heatmapPage.clickCloseAlertButton();

    // allow heatmap to update - there is sometimes another alert, so do not delay closing the background alert
    await heatmapPage.pause(2);

    const heatmapId = await heatmapPage.clickSave();

    const saveNotification = await heatmapPage.getSaveNotification();
    expect(saveNotification).toEqual("Your visualization was saved!")

    // #endregion 7. Close ""We're busy generating your heatmap with a new background model. It may take a couple of minutes to load"" toast message

    // #region 8. Close Taxon Heatmap tab, and go back to Discovery View My Data page and click on Visualization tab
    const heatmapUrl = `https://${process.env.NODE_ENV}.czid.org/visualizations/heatmap/${heatmapId}`
    await heatmapPage.close();
    // #endregion 8. Close Taxon Heatmap tab, and go back to Discovery View My Data page and click on Visualization tab

    // #region 9. Click on latest ""Heatmap"" record and verify Filters > Background value is ""floo sp97""
    await projectPage.navigateToMyData();
    await projectPage.clickVisualizationsTab();

    heatmapPage = new HeatmapPage(page);
    await heatmapPage.gotoHeatmap(heatmapUrl);

    backgroundValue = await heatmapPage.getSelectedBackground();
    expect(backgroundValue).toEqual(background);
    // #endregion 9. Click on latest ""Heatmap"" record and verify Filters > Background value is ""floo sp97""

    // #region 10. Click on Background dropdown list, pick ""None"" value, and click on Save
    await heatmapPage.setBackground(NONE);
    await heatmapPage.clickSave();
    // #endregion 10. Click on Background dropdown list, pick ""None"" value, and click on Save

    // #region 11. Close Taxon Heatmap tab, and go back to Discovery View My Data page and click on Visualization tab
    await projectPage.navigateToMyData();
    await projectPage.clickVisualizationsTab();
    // #endregion 11. Close Taxon Heatmap tab, and go back to Discovery View My Data page and click on Visualization tab

    // #region 12. Click on latest ""Heatmap"" record and verify Filters > Background value is ""None""
    await heatmapPage.gotoHeatmap(heatmapUrl);
    const backgroundValueAfter = await heatmapPage.getSelectedBackground();

    // - Saved ""None"" BG option persists when chosen back
    expect(backgroundValueAfter).toEqual(NONE);
    // #endregion 12. Click on latest ""Heatmap"" record and verify Filters > Background value is ""None""

    // #region 13. Click Threshold filter option and click on first row dropdown list
    const thresholdsOptions = await heatmapPage.getThresholdsOptions();
    // #endregion 13. Click Threshold filter option and click on first row dropdown list

    // #region 14, Verify NT / NR Z socre are displayed and disabled
    const disabledMetricOptions = ["NT Z Score", "NR Z Score"];
    for (const disabledOption of disabledMetricOptions) {
      expect(thresholdsOptions).not.toContain(disabledOption);
    }
    // #endregion 14, Verify NT / NR Z socre are displayed and disabled

    // #region 15. Click cancel and hover over a Taxon Heatmap cell with data
    await heatmapPage.hoverOverCell(0);
    // #endregion 15. Click cancel and hover over a Taxon Heatmap cell with data

    // #region 16. Verify NT / NR Z score values are ""-""
    const heatmapTooltip = await heatmapPage.getHeatmapTooltipText();

    // - Taxon heatmap cells displayed NT / NR Z score as ""-""
    expect(heatmapTooltip).toContain("NT Z Score-")
    expect(heatmapTooltip).toContain("NR Z Score-")
    // #endregion 16. Verify NT / NR Z score values are ""-""

    // #region 17. While hovering over a cell with data, click on the cell
    const samplesPage = await heatmapPage.clickCell(0);
    // #endregion 17. While hovering over a cell with data, click on the cell

    // #region 18. Observe Sample report Z Score data displayed as ""-""
    const reportTable = await samplesPage.getReportFilterTable();
    for (const taxon of reportTable) {
      // - Sample report Z Score column values displayed as ""-"""
      expect(taxon['Z Score']).toEqual("-");
    }

    // - Sample report opens in a new tab and BG model persists as ""None""
    expect(await samplesPage.getBackgroundFilterValue()).toEqual(NONE);

    // - NT / NR Z Score threshold filter options are displayed and disabled
    // #endregion 18. Observe Sample report Z Score data displayed as ""-""
  });

  /**
   * Taxon Heatmap - BG model persistance
   * Sample report
   */
  test(`SNo 6: Taxon heatmap BG selected persists in Sample report`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select or Create a Project. Example ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select or Create a Project. Example ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""

    // #region 6. While hovering over a Taxon Heatmap cell, verify its data, and click on the cell
    await heatmapPage.hoverOverCell(0);
    const heatmapTooltip = await heatmapPage.getHeatmapTooltipText();

    expect(heatmapTooltip).toContain("NT Z Score-")
    expect(heatmapTooltip).toContain("NR Z Score-")

    let samplesPage = await heatmapPage.clickCell(0);
    // #endregion 6. While hovering over a Taxon Heatmap cell, verify its data, and click on the cell

    // #region 7. At new sample report tab, verify Score, Z-Score, and Background dropdown list

    // A Taxon Heatmap with Background = ""None"" behaviour:
    // - In sample report: Background selected as ""None""
    let sampleReportBackground = await samplesPage.getBackgroundFilterValue();
    expect(sampleReportBackground).toEqual(NONE);

    // - While hovering on TH cell, NT / NR Z Score displayed as ""-""
    // - In sample report: Score and NT/NR Z Score column data displayed as ""-""
    let reportTable = await samplesPage.getReportFilterTable();
    for (const taxon of reportTable) {
      expect(taxon['Z Score']).toEqual("-");
    }
    // #endregion 7. At new sample report tab, verify Score, Z-Score, and Background dropdown list

    // #region 8. Close sample report tab, and at Taxon Heatmap, select ""NID Human CSF HC"" as Background
    await samplesPage.close();
    samplesPage = null;

    let backgrounds = await heatmapPage.getBackgrounds();
    const background1 = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    await heatmapPage.setBackground(background1);
    await heatmapPage.clickCloseAlertButton();
    // #endregion 8. Close sample report tab, and at Taxon Heatmap, select ""NID Human CSF HC"" as Background

    // #region 9. Repeat step 6-7
    samplesPage = await heatmapPage.clickCell(0);

    // A Taxon Heatmap with Background = ""NID Human CSF HC"" behaviour:
    // - In sample report: Background persists Taxon Heatmap background selection (""NID Human CSF HC"" in this case)
    sampleReportBackground = await samplesPage.getBackgroundFilterValue();
    expect(sampleReportBackground).toEqual(background1);

    // - While hovering cell: NT / NR Z Score data values displayed
    // - In sample report: Score and NT/NR Z Score column display data values
    reportTable = await samplesPage.getReportFilterTable();
    for (const taxon of reportTable) {
      expect(taxon['Z Score']).not.toEqual("-");
    }
    // #endregion 9. Repeat step 6-7

    // #region 10. Close sample report tab, and at Taxon Heatmap, select ""floo sp97"" as Background
    await samplesPage.close();
    // #endregion 10. Close sample report tab, and at Taxon Heatmap, select ""floo sp97"" as Background

    // #region 11. Repeat step 6-7
    await heatmapPage.hoverOverFilterPanel();
    backgrounds = await heatmapPage.getBackgrounds();
    const background2 = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(background2);
    await heatmapPage.clickCloseAlertButton();
    samplesPage = await heatmapPage.clickCell(0);

    // A Taxon Heatmap with Background = {other than ""None"" OR ""NID Human CSF HC""} behaviour:
    // - In sample report: Background persists Taxon Heatmap background selection (""floo sp97"" in this case)
    sampleReportBackground = await samplesPage.getBackgroundFilterValue();
    expect(sampleReportBackground).toEqual(background2);

    // - While hovering cell: NT / NR Z Score data values displayed
    // - In sample report: Score and NT/NR Z Score column display data values
    reportTable = await samplesPage.getReportFilterTable();
    for (const taxon of reportTable) {
      expect(taxon['Z Score']).not.toEqual("-");
    }
    // #endregion 11. Repeat step 6-7
  });

});

test.describe("Functional: P-0: Taxon heatmap - 3", () => {

  test.beforeEach(async () => {
    test.setTimeout(TEST_TIMEOUT);
  });

  /**
   * Taxon Heatmap - OLD existing Taxon Heatmap
   */
  test(`SNo 7: Opening and old existing Taxon Heatmap with default value as "NID Human CSF HC"`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Visualization tab
    await projectPage.clickVisualizationsTab();
    // #endregion 2. Click on Visualization tab

    // #region 3. Click on OLD Heatmap records (older than 2/1/2024)
    await projectPage.clickUpdatedOnColumnHeader();
    await projectPage.clickUpdatedOnColumnHeader();
    const vizTable = await projectPage.getVisualizationTable(TEST_TIMEOUT);

    expect(new Date(vizTable[0]['Updated On'][0]).getTime()).toBeLessThan(new Date("2/1/2024").getTime())
    // #endregion 3. Click on OLD Heatmap records (older than 2/1/2024)

    // #region 4. Verify default Filters > Background value displayed
    const heatmapPage = await projectPage.clickVisualization(Math.floor(Math.random() * vizTable.length));

    // NID Human CSF HC persists for OLD Taxon Heatmaps saved with default background value
    const background = await heatmapPage.getSelectedBackground();
    expect(background).toEqual("NID human CSF HC");
    // #endregion 4. Verify default Filters > Background value displayed
  });

  /**
   * Taxon heatmap - Metrics and Thresholds
   * Coming back to "None" BG
   */
  test(`SNo 8: Using NT / NR Z scores as Threshold and Metrics and switching back to None BG`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select or Create a Project. Example ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select or Create a Project. Example ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""

    // #region 6. Click on Background dropdown list and pick ""floo sp97"" option
    const backgrounds = await heatmapPage.getBackgrounds();
    const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(background);
    await heatmapPage.clickCloseAlertButton();
    // #endregion 6. Click on Background dropdown list and pick ""floo sp97"" option

    // #region 7. Click on Metric dropdown list and select NT Z Score
    const metricOptions = [
      {
        metric: "NT Z Score",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR Z Score",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NT rPM",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR rPM",
        operator: ">=",
        value: "1"
      }
    ]
    // #endregion 7. Click on Metric dropdown list and select NT Z Score

    // #region 8. Click on Filters > Thresholds and add NT Z Score, NR Z Score, NT rPM, NR rPM.
    await heatmapPage.setThresholdsOptions(metricOptions);

    let metricFilters = await heatmapPage.getThresholdsMetricFilters();
    const expectedFilters = [];
    for (const option of metricOptions) {
      expectedFilters.push(`${option.metric} ${option.operator} ${option.value}`);
    }
    expect(metricFilters).toEqual(expectedFilters);

    await heatmapPage.hoverOverCell(0);
    let tooltipDetails = await heatmapPage.getHeatmapTooltipDetails();
    for (const filter of metricOptions) {
      expect(Number(tooltipDetails[filter.metric])).toBeGreaterThanOrEqual(Number(filter.value))
    }
    // #endregion 8. Click on Filters > Thresholds and add NT Z Score, NR Z Score, NT rPM, NR rPM.

    // #region 9. Enter Threshold values and click apply
    await heatmapPage.clickSave();
    // #endregion 9. Enter Threshold values and click apply

    // #region 10. Click on Background dropdown list and pick ""None"" BG option back
    await heatmapPage.setBackground(NONE);
    metricOptions.shift()
    metricOptions.shift()
    expectedFilters.shift()
    expectedFilters.shift()

    // - Metrics view option value goes back to ""NT rPM"" option
    metricFilters = await heatmapPage.getThresholdsMetricFilters();
    expect(metricFilters).toEqual(expectedFilters);

    // 11. Observe Threshold and Metric values
    await heatmapPage.hoverOverCell(0);
    tooltipDetails = await heatmapPage.getHeatmapTooltipDetails();

    // - NT Z Score and NR Z Score threshold filtesr are removed
    // - NT rPM and NR rPM threshold filters persists
    // - Taxon Heatmap data refetches with new criteria
    for (const filter of metricOptions) {
      expect(Number(tooltipDetails[filter.metric])).toBeGreaterThanOrEqual(Number(filter.value))
    }
    // #endregion 10. Click on Background dropdown list and pick ""None"" BG option back
  });

  /**
   * Taxon heatmap - Downloads
   */
  test(`SNo 9: Taxon heatmap download files content when selecting None and other Backgrounds`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select or Create a Project. Example ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select or Create a Project. Example ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""

    // #region 6. Click on Download
    await heatmapPage.clickDownloadButton();
    // #endregion 6. Click on Download

    // #region 7. Download All Heatmap Metrics(.csv) report and verify its content
    await heatmapPage.clickDownloadType("All Heatmap Metrics");
    const downloadAllHeatmapMetrics = await heatmapPage.clickDownloadConfirmationButton();
    // #endregion 7. Download All Heatmap Metrics(.csv) report and verify its content

    // #region 8. Download Current Heatmap Metrics (.csv) report and verify its content
    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("Current Heatmap Metrics");
    const downloadCurrentHeatmapMetrics = await heatmapPage.clickDownloadConfirmationButton();
    // #endregion 8. Download Current Heatmap Metrics (.csv) report and verify its content

    // #region 9. Download both Heatmap image formats (.png) & (.svg) and verify its content
    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType(".png");
    const downloadHeatmapImagePNG = await heatmapPage.clickDownloadConfirmationButton();
    expect(downloadHeatmapImagePNG.suggestedFilename()).toEqual("heatmap.png")

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType(".svg");
    const downloadHeatmapImageSVG = await heatmapPage.clickDownloadConfirmationButton();
    expect(downloadHeatmapImageSVG.suggestedFilename()).toEqual("heatmap.svg")
    // #endregion 9. Download both Heatmap image formats (.png) & (.svg) and verify its content

    // #region 10. Download Combined Microbiome File(.biom) (choose any metric) and verify it Completes in Downloads page (main menu). Download the file
    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("Combined Microbiome File");
    await heatmapPage.clickDownloadMetric("NT rPM");
    await heatmapPage.clickStartDownloadButton();

    // Downloaded files when BG is None:
    // - All Heatmap Metrics (.csv) displays NT_zscore and NR_zcore as blank
    // - Combined Microbiome File(.biom) file completes and it's downloaded successfully
    let heatmapMetricsPath = await downloadAllHeatmapMetrics.path();
    let heatmapMetricsData = await fs.readFile(heatmapMetricsPath);
    let parsedheatmapMetrics = heatmapMetricsData.toString().trim().split(/\r?\n/)
    let lastColumn = parsedheatmapMetrics[parsedheatmapMetrics.length - 1];

    // - Current Heatmap Metrics (.csv) downloaded successfully. Information at the bottom of spreadsheet displays Metric, Background: None, and Filters applied
    expect(lastColumn).toEqual("Background: None")

    let currentMetricsPath = await downloadCurrentHeatmapMetrics.path();
    let currentMetricsData = await fs.readFile(currentMetricsPath);
    let parsedcurrentMetrics = currentMetricsData.toString().trim().split(/\r?\n/)
    lastColumn = parsedcurrentMetrics[parsedcurrentMetrics.length - 1];
    expect(lastColumn).toEqual("NA: Not Applicable; sample did not meet thresholds set")
    // #endregion 10. Download Combined Microbiome File(.biom) (choose any metric) and verify it Completes in Downloads page (main menu). Download the file

    // #region 11. Go back to Taxon Heatmap. Click on Background dropdown list and pick ""floo sp97"" option
    const backgrounds = await heatmapPage.getBackgrounds();
    const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(background);
    await heatmapPage.clickCloseAlertButton();
    // #endregion 11. Go back to Taxon Heatmap. Click on Background dropdown list and pick ""floo sp97"" option

    // #region 12. Click on Metric dropdown list and select NT Z Score
    await heatmapPage.setMetric("NT Z Score");
    // #endregion 12. Click on Metric dropdown list and select NT Z Score

    // #region 13. Repeat steps 6-10
    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("All Heatmap Metrics");
    const downloadAllHeatmapMetricsWithBackground = await heatmapPage.clickDownloadConfirmationButton();

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("Current Heatmap Metrics");
    const downloadCurrentHeatmapMetricsWithBackground = await heatmapPage.clickDownloadConfirmationButton();

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType(".png");
    const downloadHeatmapImagePNGWithBackground = await heatmapPage.clickDownloadConfirmationButton();
    expect(downloadHeatmapImagePNGWithBackground.suggestedFilename()).toEqual("heatmap.png")

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType(".svg");
    const downloadHeatmapImageSVGWithBackground = await heatmapPage.clickDownloadConfirmationButton();
    expect(downloadHeatmapImageSVGWithBackground.suggestedFilename()).toEqual("heatmap.svg")

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("Combined Microbiome File");
    await heatmapPage.clickDownloadMetric("NT rPM");
    await heatmapPage.clickStartDownloadButton();

    // - All Heatmap Metrics (.csv) displays NT_zscore and NR_zcore as blank
    // - Combined Microbiome File(.biom) file completes and it's downloaded successfully
    heatmapMetricsPath = await downloadAllHeatmapMetricsWithBackground.path();
    heatmapMetricsData = await fs.readFile(heatmapMetricsPath);
    parsedheatmapMetrics = heatmapMetricsData.toString().trim().split(/\r?\n/)
    lastColumn = parsedheatmapMetrics[parsedheatmapMetrics.length - 1];

    // - Current Heatmap Metrics (.csv) downloaded successfully. Information at the bottom of spreadsheet displays Metric, Background: None, and Filters applied
    expect(lastColumn).toEqual(`Background: ${background}`)

    currentMetricsPath = await downloadCurrentHeatmapMetricsWithBackground.path();
    currentMetricsData = await fs.readFile(currentMetricsPath);
    parsedcurrentMetrics = currentMetricsData.toString().trim().split(/\r?\n/)
    lastColumn = parsedcurrentMetrics[parsedcurrentMetrics.length - 1];
    expect(lastColumn).toEqual("NA: Not Applicable; sample did not meet thresholds set")
    // #endregion 13. Repeat steps 6-10
  });

});

test.describe("Functional: P-0: Taxon heatmap - 4", () => {

  test.beforeEach(async () => {
    test.setTimeout(TEST_TIMEOUT);
  });

  /**
   * Taxon heatmap - BG model persistance
   * Taxon Heatmap sharing
   */
  test(`SNo 10: Taxon Heatmap BG selected persist when shared (user with staging project access)`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select or Create a Project. Example ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select or Create a Project. Example ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""

    // #region 6. Click on Share button
    const heatmapId = await heatmapPage.clickSave();
    const heatmapUrl = `https://${process.env.NODE_ENV}.czid.org/visualizations/heatmap/${heatmapId}`
    // #endregion 6. Click on Share button

    // #region 7. Paste and Go clipboard URL in a new browser tab
    let newBrowserTab = await page.context().newPage();
    let newHeatmapPage = new HeatmapPage(newBrowserTab);
    await newHeatmapPage.gotoHeatmap(heatmapUrl);
    // #endregion 7. Paste and Go clipboard URL in a new browser tab

    // #region 8. Verify Background filter persists in shared Taxon Heatmap tab
    const selectedBackgroundInNewTabFirst = await newHeatmapPage.getSelectedBackground();

    // - ""None"" BG persisted
    expect(selectedBackgroundInNewTabFirst).toEqual(NONE);
    // #endregion 8. Verify Background filter persists in shared Taxon Heatmap tab

    // #region 9. Close shared TH and go back to original TH
    await newHeatmapPage.close();
    // #endregion 9. Close shared TH and go back to original TH

    // #region 10. Click on Filters > Background and select ""NID human CSF HC"" option
    const backgrounds = await heatmapPage.getBackgrounds();
    let randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(randomBackground);
    await heatmapPage.clickCloseAlertButton();
    // #endregion 10. Click on Filters > Background and select ""NID human CSF HC"" option

    // #region 11. Repeat steps 6-9
    await heatmapPage.clickSave();
    newBrowserTab = await page.context().newPage();
    await newBrowserTab.goto(heatmapUrl);

    newHeatmapPage = new HeatmapPage(newBrowserTab);
    const selectedBackgroundInNewTab2nd = await newHeatmapPage.getSelectedBackground();

    // - ""NID Human CSF HC"" BG persisted
    expect(selectedBackgroundInNewTab2nd).toEqual(randomBackground);
    await newHeatmapPage.close();
    // #endregion 11. Repeat steps 6-9

    // #region 12. Click on Filters > Background and select ""floo sp97"" option
    randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    await heatmapPage.setBackground(randomBackground);
    await heatmapPage.clickCloseAlertButton();
    // #endregion 12. Click on Filters > Background and select ""floo sp97"" option

    // #region 13. Repeat steps 6-9
    await heatmapPage.clickSave();
    newBrowserTab = await page.context().newPage();
    await newBrowserTab.goto(heatmapUrl);

    // Taxon Heatmap background selected persists when sharing link opens a Taxon Heatmap in new tab:
    newHeatmapPage = new HeatmapPage(newBrowserTab);
    const selectedBackgroundInNewTab3rd = await newHeatmapPage.getSelectedBackground();

    // - ""floo sp97"" BG persisted
    expect(selectedBackgroundInNewTab3rd).toEqual(randomBackground);
    // #endregion 13. Repeat steps 6-9
  });

  /**
   * Taxon heatmap - Remove multiple Filtering criteria options
   */
  test(`SNo 11: Threshold filtering criteria removal`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const heatmapUrl = await createHeatmap(projectPage);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Visualization tab
    await projectPage.clickVisualizationsTab();
    // #endregion 2. Click on Visualization tab

    // #region 3. Click on an ""Heatmap sp961"" record in Visualization list
    const heatmapPage = new HeatmapPage(page);
    await heatmapPage.gotoHeatmap(heatmapUrl);
    // #endregion 3. Click on an ""Heatmap sp961"" record in Visualization list

    // #region 4. Select ""floo sp97"" background value
    const backgrounds = await heatmapPage.getBackgrounds();
    let randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(randomBackground);
    await heatmapPage.clickCloseAlertButton();
    // #endregion 4. Select ""floo sp97"" background value

    // #region 5. Click on Thresholds filter at Filters left panel
    const thresholdOptions = [
      {
        metric: "NT Z Score",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR Z Score",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NT rPM",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR rPM",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NT r (total reads)",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR r (total reads)",
        operator: ">=",
        value: "1"
      }
    ]
    // #endregion 5. Click on Thresholds filter at Filters left panel

    // #region 6. Click on Filters > Thresholds and add NT Z Score, NR Z Score, NT rPM, NR rPM, NT r (total reads), NR r (total reads)
    await heatmapPage.setThresholdsOptions(thresholdOptions);
    // #endregion 6. Click on Filters > Thresholds and add NT Z Score, NR Z Score, NT rPM, NR rPM, NT r (total reads), NR r (total reads)

    // #region 7. Enter Threshold values and click apply
    await heatmapPage.clickSave();
    // #endregion 7. Enter Threshold values and click apply

    // #region 8. Click on Categories, select all options and click apply
    const categoryOptions = await heatmapPage.getCategoryOptions();
    await heatmapPage.setCategoryOption(categoryOptions);
    // #endregion 8. Click on Categories, select all options and click apply

    // #region 9. Click on Metric Z Score and choose NT Z Score option
    await heatmapPage.setMetric("NT Z Score");
    // #endregion 9. Click on Metric Z Score and choose NT Z Score option

    // #region 10. Click on Background and select ""None"" value
    await heatmapPage.setBackground(NONE);
    // #endregion 10. Click on Background and select ""None"" value

    // #region 11. Observe Filtering Categories, Thresholds and Metrics sections

    // When switching from a BG value to ""None"" BG:
    // - All Categories filters persist
    let actualCategorySelections = await heatmapPage.getCategorySelections();
    const expectedCategoryOptions = [...categoryOptions];
    expectedCategoryOptions[expectedCategoryOptions.indexOf("Viruses - Phage")] = "Phage";
    expect(actualCategorySelections.sort()).toEqual(expectedCategoryOptions.sort());

    // - NT / NR Z Score threshold filters are removed
    let actualThresholdSelections = await heatmapPage.getThresholdSelections();
    const expectedThresholdOptions = [];
    for (const option of thresholdOptions) {
      if (!option.metric.endsWith("Score")) {
        expectedThresholdOptions.push(`${option.metric} ${option.operator} ${option.value}`)
      }
    }
    expect(actualThresholdSelections).toEqual(expectedThresholdOptions);

    // - Metrics switches to ""NT rPM""
    const expectedMetricSelection = "NT rPM";
    let actualMetricSelection = await heatmapPage.getMetricSelection();
    expect(actualMetricSelection).toEqual(expectedMetricSelection);
    // #endregion 11. Observe Filtering Categories, Thresholds and Metrics sections

    // #region 12. Remove ALL Categories and Threshold filters selected one by one and observe Taxon Heatmap
    await heatmapPage.removeAllFilters();

    // Filtering selection criteria (Categories / Thresholds) removed correctly and Taxon Heatmap re-fetch data to its original state
    actualCategorySelections = await heatmapPage.getCategorySelections();
    actualThresholdSelections = await heatmapPage.getThresholdSelections();
    expect(actualCategorySelections).toEqual([]);
    expect(actualThresholdSelections).toEqual([]);
    // #endregion 12. Remove ALL Categories and Threshold filters selected one by one and observe Taxon Heatmap

    // #region 13. Repeat steps 4-9
    randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    await heatmapPage.setBackground(randomBackground);
    await heatmapPage.clickCloseAlertButton();

    await heatmapPage.setThresholdsOptions(thresholdOptions);
    await heatmapPage.setCategoryOption(categoryOptions);
    await heatmapPage.setMetric("NT Z Score");
    await heatmapPage.setBackground(NONE);

    // When switching from ""None"" to a BG value (floo sp97 in this case)
    // - Taxon Heatmap re-fetch data with current BG and Metric selected

    // - All Categories filters removed correctly
    actualCategorySelections = await heatmapPage.getCategorySelections();
    expect(actualCategorySelections.sort()).toEqual(expectedCategoryOptions.sort());

    // - NT Z Score, NR Z Score, NT rPM, NR rPM, NT r (total reads), NR r (total reads) filters removed correctly
    actualThresholdSelections = await heatmapPage.getThresholdSelections();
    expect(actualThresholdSelections).toEqual(expectedThresholdOptions);

    // - Metrics persists as ""NT Z Score""
    actualMetricSelection = await heatmapPage.getMetricSelection();
    expect(actualMetricSelection).toEqual(expectedMetricSelection);
    // #endregion 13. Repeat steps 4-9

    // #region 14. Remove ALL Categories and Threshold filters selected one by one and observe Taxon Heatmap
    await heatmapPage.removeAllFilters();

    actualCategorySelections = await heatmapPage.getCategorySelections();
    actualThresholdSelections = await heatmapPage.getThresholdSelections();

    expect(actualCategorySelections).toEqual([]);
    expect(actualThresholdSelections).toEqual([]);
    // #endregion 14. Remove ALL Categories and Threshold filters selected one by one and observe Taxon Heatmap
  });

  /**
   * Heatmap sample report
   */
  test(`SNo 12: Compare cell information vs sample report`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    const heatmapUrl = await createHeatmap(projectPage);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Click on Visualization tab
    await projectPage.clickVisualizationsTab();
    // #endregion 2. Click on Visualization tab

    // #region 3. Click on an ""Heatmap sp961"" record in Visualization list
    const heatmapPage = new HeatmapPage(page);
    await heatmapPage.gotoHeatmap(heatmapUrl);
    // #endregion 3. Click on an ""Heatmap sp961"" record in Visualization list

    // #region 4. Select ""floo sp97"" background value
    const backgrounds = await heatmapPage.getBackgrounds();
    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(randomBackground);
    await heatmapPage.clickCloseAlertButton();
    // #endregion 4. Select ""floo sp97"" background value

    // #region 5. Click on Thresholds filter at Filters left panel
    const thresholdOptions = [
      {
        metric: "NT Z Score",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR Z Score",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NT rPM",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR rPM",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NT r (total reads)",
        operator: ">=",
        value: "1"
      },
      {
        metric: "NR r (total reads)",
        operator: ">=",
        value: "1"
      }
    ]
    // #endregion 5. Click on Thresholds filter at Filters left panel

    // #region 6. Click on Filters > Thresholds and add NT Z Score, NR Z Score, NT rPM, NR rPM, NT r (total reads), NR r (total reads)
    await heatmapPage.setThresholdsOptions(thresholdOptions);
    // #endregion 6. Click on Filters > Thresholds and add NT Z Score, NR Z Score, NT rPM, NR rPM, NT r (total reads), NR r (total reads)

    // #region 7. Enter Threshold values and click apply
    await heatmapPage.clickSave();
    // #endregion 7. Enter Threshold values and click apply

    // #region 8. Click on Categories, select all options and click apply
    const categoryOptions = await heatmapPage.getCategoryOptions();
    await heatmapPage.setCategoryOption(categoryOptions);
    // #endregion 8. Click on Categories, select all options and click apply

    // #region 9. Click on Metric Z Score and choose NT Z Score option
    await heatmapPage.setMetric("NT Z Score");
    // #endregion 9. Click on Metric Z Score and choose NT Z Score option

    // #region 10. Click on Background and select ""None"" value
    await heatmapPage.setBackground(NONE);

    await heatmapPage.clickSave();
    // #endregion 10. Click on Background and select ""None"" value

    // #region 11. Observe Filtering Categories, Thresholds and Metrics sections

    // "When switching from a BG value to ""None"" BG:
    // - All Categories filters persist
    let actualCategorySelections = await heatmapPage.getCategorySelections();
    const expectedCategoryOptions = [...categoryOptions];
    expectedCategoryOptions[expectedCategoryOptions.indexOf("Viruses - Phage")] = "Phage";
    expect(actualCategorySelections.sort()).toEqual(expectedCategoryOptions.sort());

    // - NT / NR Z Score threshold filters are removed
    let actualThresholdSelections = await heatmapPage.getThresholdSelections();
    const expectedThresholdOptions = [];
    for (const option of thresholdOptions) {
      if (!option.metric.endsWith("Score")) {
        expectedThresholdOptions.push(`${option.metric} ${option.operator} ${option.value}`)
      }
    }
    expect(actualThresholdSelections).toEqual(expectedThresholdOptions);

    // - Metrics switches to ""NT rPM""
    const expectedMetricSelection = "NT rPM";
    let actualMetricSelection = await heatmapPage.getMetricSelection();
    expect(actualMetricSelection).toEqual(expectedMetricSelection);

    const heatmapCellsBefore = await heatmapPage.getCellsCount();

    // Remove ALL Categories and Threshold filters selected one by one and observe Taxon Heatmap
    await heatmapPage.removeAllFilters();

    // Filtering selection criteria (Categories / Thresholds) removed correctly and Taxon Heatmap re-fetch data to its original state
    await heatmapPage.setBackground(randomBackground);
    await heatmapPage.clickCloseAlertButton();

    await heatmapPage.clickSave();
    await heatmapPage.getCellsCount();

    // - All Categories filters removed correctly
    actualCategorySelections = await heatmapPage.getCategorySelections();
    expect(actualCategorySelections).toEqual([]);

    // - NT Z Score, NR Z Score, NT rPM, NR rPM, NT r (total reads), NR r (total reads) filters removed correctly
    actualThresholdSelections = await heatmapPage.getThresholdSelections();
    expect(actualThresholdSelections).toEqual([]);

    // - Metrics persists as ""NT Z Score""
    actualMetricSelection = await heatmapPage.getMetricSelection();
    expect(actualMetricSelection).toEqual(expectedMetricSelection);

    // - Taxon Heatmap re-fetch data with current BG and Metric selected"
    const heatmapCellsAfter = await heatmapPage.getCellsCount();
    expect(heatmapCellsBefore).toBeLessThanOrEqual(heatmapCellsAfter);
    // #endregion 11. Observe Filtering Categories, Thresholds and Metrics sections
  });

  /**
   * Taxon heatmap - Downloads
   */
  test(`SNo 21: Taxon heatmap download files content when selecting None and other Backgrounds`, async ({ page }) => {
    // #region 1. Login to CZ ID staging
    const projectPage = new ProjectPage(page);
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Select Project ""floo sp97""
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS);
    // #endregion 2. Select Project ""floo sp97""

    // #region 3. Select some samples and click on Heatmap icon
    await projectPage.selectCompletedSamples(2);
    // #endregion 3. Select some samples and click on Heatmap icon

    // #region 4. Select Taxon Heatmap option
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    // #endregion 4. Select Taxon Heatmap option

    // #region 5. Verify Filters left panel > Background filter is ""None""
    const selectedBackground = await heatmapPage.getSelectedBackground();
    expect(selectedBackground).toEqual(NONE);
    // #endregion 5. Verify Filters left panel > Background filter is ""None""

    // #region 6. Click on Download
    await heatmapPage.clickDownloadButton();
    // #endregion 6. Click on Download

    // #region 7. Download All Heatmap Metrics(.csv) report and verify its content
    await heatmapPage.clickDownloadType("All Heatmap Metrics");
    const ntRPMAllHeatmapMetricsDownload = await heatmapPage.clickDownloadConfirmationButton();
    // #endregion 7. Download All Heatmap Metrics(.csv) report and verify its content

    // #region 8. Download Current Heatmap Metrics (.csv) report and verify its content
    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("Current Heatmap Metrics");
    const ntRPMCurrentHeatmapMetricsDownload = await heatmapPage.clickDownloadConfirmationButton();
    // #endregion 8. Download Current Heatmap Metrics (.csv) report and verify its content

    // #region 9. Download both Heatmap image formats (.png) & (.svg) and verify its content
    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType(".png");
    const ntRPMPngDownload = await heatmapPage.clickDownloadConfirmationButton();

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType(".svg");
    const ntRPMSvgDownload = await heatmapPage.clickDownloadConfirmationButton();
    // #endregion 9. Download both Heatmap image formats (.png) & (.svg) and verify its content

    // #region 10. Download Combined Microbiome File(.biom) (choose any metric)
    // and verify it Completes in Downloads page (main menu). Download the file
    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("Combined Microbiome File");
    await heatmapPage.clickDownloadMetric("NT rPM");
    const ntRPMdownloadId = await heatmapPage.clickStartDownloadButton();

    await heatmapPage.clickSave();
    const heatmapUrl = await heatmapPage.clickShareButton();

    const downloadsPage = new DownloadsPage(page);
    await downloadsPage.navigateToDownloads();

    const ntRPMDownloadComnpleted = await downloadsPage.waitForDownloadComplete(ntRPMdownloadId, TEST_TIMEOUT);
    // #endregion 10. Download Combined Microbiome File(.biom) (choose any metric)

    // #region 11. Go back to Taxon Heatmap. Click on Background dropdown list and pick ""floo sp97"" option
    await heatmapPage.gotoHeatmap(heatmapUrl);

    const backgrounds = await heatmapPage.getBackgrounds();
    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    await heatmapPage.setBackground(randomBackground);
    await heatmapPage.clickCloseAlertButton();
    // #endregion 11. Go back to Taxon Heatmap. Click on Background dropdown list and pick ""floo sp97"" option

    // #region 12. Click on Metric dropdown list and select NT Z Score
    await heatmapPage.setMetric("NT Z Score")
    await heatmapPage.clickSave();

    // "Downloaded files when BG is None:
    // - All Heatmap Metrics (.csv) displays NT_zscore and NR_zcore as blank
    const heatmapMetricsPath = await ntRPMAllHeatmapMetricsDownload.path();
    const heatmapMetricsData = await fs.readFile(heatmapMetricsPath);
    const parsedheatmapMetrics = heatmapMetricsData.toString().trim().split(/\r?\n/)
    let lastColumn = parsedheatmapMetrics[parsedheatmapMetrics.length - 1];

    // - Current Heatmap Metrics (.csv) downloaded successfully. Information at the bottom of spreadsheet displays Metric, Background: None, and Filters applied
    expect(lastColumn).toEqual(`Background: ${NONE}`)

    const currentMetricsPath = await ntRPMCurrentHeatmapMetricsDownload.path();
    const currentMetricsData = await fs.readFile(currentMetricsPath);
    const parsedcurrentMetrics = currentMetricsData.toString().trim().split(/\r?\n/)
    lastColumn = parsedcurrentMetrics[parsedcurrentMetrics.length - 1];
    expect(lastColumn).toEqual("NA: Not Applicable; sample did not meet thresholds set")

    // - Heatmap Image files (.png) & (.svg) display Background: None (bottom)
    expect(ntRPMPngDownload.suggestedFilename()).toEqual("heatmap.png")
    expect(ntRPMSvgDownload.suggestedFilename()).toEqual("heatmap.svg")

    // - Combined Microbiome File(.biom) file completes and it's downloaded successfully
    expect(ntRPMDownloadComnpleted).toBeTruthy();
    // #endregion 12. Click on Metric dropdown list and select NT Z Score

    // #region 13. Repeat steps 6-10
    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("All Heatmap Metrics");
    const ntZScoreAllHeatmapMetricsDownload = await heatmapPage.clickDownloadConfirmationButton();

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("Current Heatmap Metrics");
    const ntZScoreCurrentHeatmapMetricsDownload = await heatmapPage.clickDownloadConfirmationButton();

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType(".png");
    const ntZScorePngDownload = await heatmapPage.clickDownloadConfirmationButton();

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType(".svg");
    const ntZScoreSvgDownload = await heatmapPage.clickDownloadConfirmationButton();

    await heatmapPage.clickDownloadButton();
    await heatmapPage.clickDownloadType("Combined Microbiome File");
    await heatmapPage.clickDownloadMetric("NT rPM");
    const ntrPMDownloadId = await heatmapPage.clickStartDownloadButton();

    await heatmapPage.clickSave();

    await downloadsPage.navigateToDownloads();

    const downloadComnpleted = await downloadsPage.waitForDownloadComplete(ntrPMDownloadId, TEST_TIMEOUT);

    // All Heatmap Metrics (.csv) when BG is {other than ""None""} (""floo sp97"" in this case):
    // - All Heatmap Metrics (.csv) displays NT_zscore and NR_zcore data value results and Background: floo sp97 (bottom)
    // - Current Heatmap Metrics (.csv) downloaded successfully. Information at the bottom of spreadsheet displays Metric (NT.Zscore in this case), Background: floo sp97, and Filters applied
    // - Heatmap Image files (.png) & (.svg) display Background: floo sp97 (bottom) and NT.Zscore (in this case)
    // - Combined Microbiome File(.biom) file completes and it's downloaded successfully"

    const ntZScoreHeatmapMetricsPath = await ntZScoreAllHeatmapMetricsDownload.path();
    const ntZScoreHeatmapMetricsData = await fs.readFile(ntZScoreHeatmapMetricsPath);
    const ntZScoreParsedheatmapMetrics = ntZScoreHeatmapMetricsData.toString().trim().split(/\r?\n/)
    let ntZScoreLastColumn = ntZScoreParsedheatmapMetrics[ntZScoreParsedheatmapMetrics.length - 1];

    expect(ntZScoreLastColumn).toEqual(`Background: ${randomBackground}`)

    const ntZScoreCurrentMetricsPath = await ntZScoreCurrentHeatmapMetricsDownload.path();
    const ntZScoreCurrentMetricsData = await fs.readFile(ntZScoreCurrentMetricsPath);
    const ntZScoreParsedcurrentMetrics = ntZScoreCurrentMetricsData.toString().trim().split(/\r?\n/)
    ntZScoreLastColumn = ntZScoreParsedcurrentMetrics[ntZScoreParsedcurrentMetrics.length - 1];
    expect(ntZScoreLastColumn).toEqual("NA: Not Applicable; sample did not meet thresholds set")

    expect(ntZScorePngDownload.suggestedFilename()).toEqual("heatmap.png")
    expect(ntZScoreSvgDownload.suggestedFilename()).toEqual("heatmap.svg")

    expect(ntRPMDownloadComnpleted).toBeTruthy();
    expect(downloadComnpleted).toBeTruthy();
    // #endregion 13. Repeat steps 6-10
  });

});

async function createHeatmap(projectPage: any) {
    const project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.MNGS}`);
    await projectPage.navigateToSamples(project.id, WORKFLOWS.MNGS)
    await projectPage.selectCompletedSamples(2);
    await projectPage.clickHeatmapButton();
    const heatmapPage = await projectPage.clickTaxonHeatmap();
    const heatmapId = await heatmapPage.clickSave();
    const heatmapUrl = `https://${process.env.NODE_ENV}.czid.org/visualizations/heatmap/${heatmapId}`
    heatmapPage.close();

    return heatmapUrl;
}
