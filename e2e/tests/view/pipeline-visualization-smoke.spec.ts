import { WORKFLOWS } from "@e2e/constants/common";
import { test, expect } from "@playwright/test";
import { SamplesPage } from "../../page-objects/samples-page";

let sample = null;
let samplesPage = null;
let pipelineVizPage = null;

test.describe("Pipeline Visualization", () => {

  test.beforeEach(async ({ page }) => {
    // #region Get a random completed sample
    samplesPage = new SamplesPage(page);
    sample = await samplesPage.getRandomCompletedSample(`automation_project_${WORKFLOWS.MNGS}`);
    // #endregion Get a random completed sample

    // #region Go to the sample report page
    await samplesPage.navigate(sample.id);
    // #endregion Go to the sample report page

    // #region Click SAMPLE DETAILS
    await samplesPage.clickSampleDetailsButton();
    // #endregion Click SAMPLE DETAILS

    // #region Click the Pipelines tab
    await samplesPage.clickPipelinesTab();
    // #endregion Click the Pipelines tab

    // #region Click the View Pipeline Visualization link
    pipelineVizPage = await samplesPage.clickViewPipelineVisualizationLink();
    // #endregion Click the View Pipeline Visualization link
  });

  /**
   * Verify the Pipeline Visualization loads
   * http://watch.test.valuestreamproducts.com/test_case/?project=8&action=edit&issue_key=CZI-40
   */
  test("Smoke Test: Pipeline Visualization loads", async () => {
    // Verify the page title is "Pipeline Visualization"
    const pageHeader = await pipelineVizPage.getPageHeaderText();
    expect(pageHeader).toEqual("Pipeline Visualization");

    // Verify the expected sample was loaded
    const sampleDetails = await pipelineVizPage.getSampleDetails();
    expect(+sampleDetails.id).toEqual(sample.id);
    expect(sampleDetails.name).toEqual(sample.name);

    // Verify the visualization graphs are visible
    expect(await pipelineVizPage.areVizNetworkGraphsVisible()).toBeTruthy();
  });
});
