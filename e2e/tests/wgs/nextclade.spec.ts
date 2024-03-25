import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { runPipelineIfNeeded } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const SARS_CoV2_NO_HOST = "wgs_SARS_CoV2_no_host";
const SARS_CoV2_SAMPLE_NAMES = [SARS_CoV2_NO_HOST];

let sc2_project = null;
let wgs_project = null;
let projectPage = null;
const timeout = 60 * 1000 * 5;
const RUN_PIPELINE = true;
const WAIT_FOR_PIPELINE = false;

/*
 * WGS Nextclade - Mixed
 */
test.describe("WGS Nextclade - Mixed: Functional: P-0", () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(timeout);
    projectPage = new ProjectPage(page);
    sc2_project = await projectPage.getOrCreateProject(`NextClade_${WORKFLOWS.SC2}`);
  });

  test("SNo WGS - 46: Nextclade enabled when selecting WGS / SC2 samples", async ({ page }) => {
    await runPipelineIfNeeded(
      page,
      sc2_project,
      WGS_SAMPLE_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.WGS,
      {hostOrganism: "Human", taxon: "Unknown", runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );

    // #region 1. Log in to Project
    await projectPage.navigateToMyData();
    // #endregion 1. Log in to Project

    // #region 2. Open [floo WGS1] Project
    await projectPage.navigateToSamples(sc2_project.id, WORKFLOWS.WGS);
    // #endregion 2. Open [floo WGS1] Project

    // #region 3. Navigate to Consensus Genome tab
    wgs_project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    await projectPage.navigateToSamples(wgs_project.id, WORKFLOWS.WGS);
    // #endregion 3. Navigate to Consensus Genome tab

    // #region 4. Click on Select All samples checkbox
    // Nextclade phylo tree icon enables when selecting WGS / SC2 samples mixed
    const wgsSampleNames = await projectPage.selectCompletedSamples(2);

    await projectPage.fillSearchMyDataInput(sc2_project.name);
    await projectPage.clickProjectSearchResult(sc2_project.name);

    const sampleNamesSentToNextclade = await projectPage.selectCompletedSamples(1);
    // #endregion 4. Click on Select All samples checkbox

    // #region 5. Click on Nextclade tree icon
    await projectPage.clickNextcladeTreeButton();
    // #endregion 5. Click on Nextclade tree icon

    // #region 6. Observe Nextclade popup window
    const notificationMessages = await projectPage.getNotificationMessages();

    // Discarded message is displayed in Nextclade popup window (bottom):
    // [X] consensus genomes won't be sent to Nextclade, because Nextclade only accepts SARS-CoV-2 genomes currently: {list of samples}
    expect(notificationMessages.length).toEqual(1);
    const expectedNotification = `${wgsSampleNames.length} consensus genome${wgsSampleNames.length > 1 ? "s" : ""} won't be sent to Nextclade, because Nextclade only accepts SARS-CoV-2 genomes currently:`;
    expect(notificationMessages[0]).toContain(expectedNotification);
    const samplesInNotifcation = notificationMessages[0].split(":")[1];
    for (const sampleName of wgsSampleNames) {
      expect(samplesInNotifcation).toContain(sampleName);
    }
    // #endregion 6. Observe Nextclade popup window

    // #region 7. Select Nextclade Default Tree radio button
    await projectPage.clickNextcladeDefaultTree();
    // #endregion 7. Select Nextclade Default Tree radio button

    // #region 8. Click on ""View QC in Nextclade"" button
    await projectPage.clickViewQCInNextcladeButton();
    // #endregion 8. Click on ""View QC in Nextclade"" button

    // #region 9. Click on ""Confirm"" button in Nextclade (beta) window
    const nextcladePage = await projectPage.clickNextcladeConfirmButton();

    // New Nextclade tab window opens with SC2 Sample(s) selected listed
    const nextcladeSampleNames = (await nextcladePage.getSampleNames()).sort();
    expect(nextcladeSampleNames).toEqual(sampleNamesSentToNextclade);
    // and results table using Nextclade default tree
    expect(await nextcladePage.url()).toMatch(/.+\/results$/);
    // #endregion 9. Click on ""Confirm"" button in Nextclade (beta) window
  });
});
