import { WORKFLOWS } from "@e2e/constants/common";
import {
  SAMPLE_FILE_CT20K,
  SAMPLE_FILE_NO_HOST_1,
  SAMPLE_FILE_NO_HOST_2,
} from "@e2e/constants/sample";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const CT20K_SAMPLE_NAME = "Ct20K";

let projectPage = null;
const timeout = 60 * 1000 * 5;
const RUN_PIPELINE = false;
const WAIT_FOR_PIPELINE = false;

/*
 * WGS Nextclade - Mixed
 */
test.describe("WGS Nextclade - Mixed: Functional: P-0", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(timeout);
    projectPage = new ProjectPage(page);
    const isFFUser = await projectPage.isFeatureFlagUser();
    if (isFFUser) {
      test.skip(); // TODO: Nexclade is temporarily unavailable for Feature Flags users. Skip these tests
    }
  });

  test("SNo WGS - 46: Nextclade enabled when selecting WGS / SC2 samples", async ({
    page,
  }) => {
    // #region Setup
    const sc2_project = await projectPage.getOrCreateProject(
      `SNo-WGS-46_${WORKFLOWS.SC2}`,
    );
    await projectPage.deleteSamplesOlderThanGivenMonths(
      sc2_project,
      WORKFLOWS.SC2,
      5,
    );
    await projectPage.deleteSamplesOlderThanGivenMonths(
      sc2_project,
      WORKFLOWS.WGS,
      5,
    );
    const sc2_samples = await setupSamples(
      page,
      sc2_project,
      [SAMPLE_FILE_CT20K],
      [CT20K_SAMPLE_NAME],
      WORKFLOWS.SC2,
      {
        hostOrganism: "Human",
        taxon: "Unknown",
        sequencingPlatform: WORKFLOWS.LMNGS,
        runPipeline: RUN_PIPELINE,
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    const wgs_samples = await setupSamples(
      page,
      sc2_project,
      [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2],
      ["wgs_SARS_CoV2_no_host"],
      WORKFLOWS.WGS,
      {
        hostOrganism: "Human",
        taxon: "Unknown",
        runPipeline: RUN_PIPELINE,
        waitForPipeline: WAIT_FOR_PIPELINE,
      },
    );
    // #endregion Setup

    // #region 1. Log in to Project
    await projectPage.navigateToMyData();
    // #endregion 1. Log in to Project

    // #region 2. Open [floo WGS1] Project
    await projectPage.navigateToSamples(sc2_project.id, WORKFLOWS.WGS);
    // #endregion 2. Open [floo WGS1] Project

    // #region 3. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(sc2_project.id, WORKFLOWS.WGS);
    // #endregion 3. Navigate to Consensus Genome tab

    // #region 4. Click on Select All samples checkbox
    await projectPage.clickSelectAllSamples();
    // #endregion 4. Click on Select All samples checkbox

    // #region 5. Click on Nextclade tree icon
    // Nextclade phylo tree icon enables when selecting WGS / SC2 samples mixed
    await projectPage.clickNextcladeTreeButton();
    // #endregion 5. Click on Nextclade tree icon

    // #region 6. Observe Nextclade popup window
    const notificationMessages = await projectPage.getNotificationMessages();

    // Discarded message is displayed in Nextclade popup window (bottom):
    // [X] consensus genomes won't be sent to Nextclade, because Nextclade only accepts SARS-CoV-2 genomes currently: {list of samples}
    expect(notificationMessages.length).toEqual(1);
    const expectedNotification = `${wgs_samples.length} consensus genome${
      wgs_samples.length > 1 ? "s" : ""
    } won't be sent to Nextclade, because Nextclade only accepts SARS-CoV-2 genomes currently:`;
    expect(notificationMessages[0]).toContain(expectedNotification);
    const samplesInNotifcation = notificationMessages[0].split(":")[1];
    for (const wgs_sample of wgs_samples) {
      expect(samplesInNotifcation).toContain(wgs_sample.name);
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
    expect(nextcladeSampleNames).toEqual([sc2_samples[0].name]);
    // and results table using Nextclade default tree
    expect(await nextcladePage.url()).toMatch(/.+\/results$/);
    // #endregion 9. Click on ""Confirm"" button in Nextclade (beta) window
  });
});
