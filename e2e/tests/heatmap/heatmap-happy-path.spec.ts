import { WORKFLOWS } from "@e2e/constants/common";
import { test } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

let projectPage = null;
let heatmapPage = null;

let heatmapSamples = null;
let project = null;

const TEST_TIMEOUT = 60 * 1000 * 4;

test.describe("Heatmap happy path", () => {
  test("SNo 1: User is able to create and view a heatmap", async ({ page }) => {
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

    // #region Dismiss Appcues container if present
    await heatmapPage.dismissAppcuesContainerIfPresent();
    await heatmapPage.validateNotificationContainerIsNotPresent();
    // #endregion Dismiss Appcues container if present

    // #region Validate the heatmap was created for the selected samples
    await heatmapPage.validateHeatmapSampleNames(heatmapSamples);
    // #endregion Validate the heatmap was created for the selected samples
  });
});
