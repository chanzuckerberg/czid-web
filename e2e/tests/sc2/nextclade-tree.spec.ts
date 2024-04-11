import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2, SAMPLE_FILE_1_PAIRED_R1, SAMPLE_FILE_1_PAIRED_R2 } from "@e2e/constants/sample";
import { setupSamples } from "@e2e/page-objects/user-actions";
import { test, expect } from "@playwright/test";
import { ProjectPage } from "../../page-objects/project-page";

const WGS_SAMPLE_FILES = [SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2];
const SARS_CoV2_NO_HOST = "wgs_SARS_CoV2_no_host";
const SARS_CoV2_SAMPLE_NAMES = [SARS_CoV2_NO_HOST];

const CT20K_SAMPLE_FILES = [SAMPLE_FILE_1_PAIRED_R1, SAMPLE_FILE_1_PAIRED_R2];
const SAMPLE_1_PAIRED = "Sample_1_Paired";
const CT20K_SAMPLE_NAMES = [SAMPLE_1_PAIRED];

const NEXTCLADE_REFERENCE_JSON_FILE = require.resolve("@e2e/fixtures/nextclade_trees/pawnee_fake_example.json");

let wgs_project = null;
let projectPage = null;
const timeout = 60 * 1000 * 5;
const RUN_PIPELINE = false;
const WAIT_FOR_PIPELINE = false;

/*
 * NextClade Tree
 */
test.describe("NextClade Tree: Functional: P-0", () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(timeout);
    projectPage = new ProjectPage(page);
  });

  test("SNo 23: Create a Nextclade Tree", async ({ page }) => {
    const sc2_project = await projectPage.getOrCreateProject(`SNo-23_NextClade_${WORKFLOWS.SC2}`);
    await setupSamples(
      page,
      sc2_project,
      WGS_SAMPLE_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      {hostOrganism: "Human", taxon: "Unknown", runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );

    // #region 1. Log in to Project
    await projectPage.navigateToMyData();
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    await projectPage.navigateToSamples(sc2_project.id, WORKFLOWS.WGS);
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Select only SC2 Sample(s)
    const samplesToSelect = Math.floor(Math.random() * 3) + 1;
    const sampleNames = (await projectPage.selectCompletedSamples(samplesToSelect)).sort();
    // #endregion 3. Select only SC2 Sample(s)

    // #region 4. Click on Nextclade tree icon
    await projectPage.clickNextcladeTreeButton();
    // #endregion 4. Click on Nextclade tree icon

    // #region 5. Select Nextclade Default Tree radio button
    await projectPage.clickNextcladeDefaultTree();
    // #endregion 5. Select Nextclade Default Tree radio button

    // #region 6. Click on ""View QC in Nextclade"" button
    await projectPage.clickViewQCInNextcladeButton();
    // #endregion 6. Click on ""View QC in Nextclade"" button

    // #region 7. Click on ""Confirm"" button in Nextclade (beta) window
    const nextcladePage = await projectPage.clickNextcladeConfirmButton();
    // #endregion 7. Click on ""Confirm"" button in Nextclade (beta) window

    // New Nextclade tab window opens with Sample(s) selected listed and results table
    const errorMessages = await projectPage.getErrorMessages();
    expect(errorMessages).toEqual([]);

    const nextcladeSampleNames = (await nextcladePage.getSampleNames()).sort();
    expect(nextcladeSampleNames).toEqual(sampleNames);
  });

  test("SNo 25: Create a Nextclade Tree with a mixture of samples with and without reference assension", async ({ page }) => {
    const sc2_project = await projectPage.getOrCreateProject(`SNo-25_NextClade_${WORKFLOWS.SC2}`);
    await setupSamples(
      page,
      sc2_project,
      WGS_SAMPLE_FILES,
      SARS_CoV2_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      {hostOrganism: "Human", taxon: "Unknown", runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );

    // #region 1. Log in to Project
    await projectPage.navigateToMyData();
    // #endregion 1. Log in to Project

    // #region 2. Navigate to Consensus Genome tab
    wgs_project = await projectPage.getOrCreateProject(`automation_project_${WORKFLOWS.WGS}`);
    await projectPage.navigateToSamples(wgs_project.id, WORKFLOWS.WGS);
    // #endregion 2. Navigate to Consensus Genome tab

    // #region 3. Select SC2 and WGS Samples
    let wgsSampleNames = await projectPage.selectCompletedSamples(2);

    await projectPage.fillSearchMyDataInput(sc2_project.name);
    await projectPage.clickProjectSearchResult(sc2_project.name);

    const sampleNamesSentToNextclade = await projectPage.selectCompletedSamples(1);
    // #endregion 3. Select SC2 and WGS Samples

    // #region 4. Click on Nextclade tree icon
    await projectPage.clickNextcladeTreeButton();

    // - Warning message displayed at bottom of Nextclade window that reads:
    // (X) consensus genomes won't be sent to Nextclade, because Nextclade only accepts SARS-CoV-2 genomes currently:
    // {sample_name_X1}
    // {sample_name_X2}
    const notificationMessages = await projectPage.getNotificationMessages();
    let expectedNotification = `${wgsSampleNames.length} consensus genome${wgsSampleNames.length > 1 ? "s" : ""} won't be sent to Nextclade, because Nextclade only accepts SARS-CoV-2 genomes currently:`;
    wgsSampleNames = await wgsSampleNames.reverse();
    for (const sampleName of wgsSampleNames.sort()) {
      expectedNotification += sampleName;
    }
    expect(notificationMessages).toEqual([expectedNotification]);
    // #endregion 4. Click on Nextclade tree icon

    // #region 5. Select Nextclade Default Tree radio button
    await projectPage.clickNextcladeDefaultTree();
    // #endregion 5. Select Nextclade Default Tree radio button

    // #region 6. Click on ""View QC in Nextclade"" button
    await projectPage.clickViewQCInNextcladeButton();
    // #endregion 6. Click on ""View QC in Nextclade"" button

    // #region 7. Click on ""Confirm"" button in Nextclade (beta) window
    const nextcladePage = await projectPage.clickNextcladeConfirmButton();
    // #endregion 7. Click on ""Confirm"" button in Nextclade (beta) window

    // New Nextclade tab window opens with Sample(s) selected listed and results table
    const errorMessages = await projectPage.getErrorMessages();
    expect(errorMessages).toEqual([]);

    const nextcladeSampleNames = (await nextcladePage.getSampleNames()).sort();
    expect(nextcladeSampleNames).toEqual(sampleNamesSentToNextclade);
  });

  /*
   * Nextclade - Create a tree
   * Own Project / Default tree
   */
  test("SNo SC2-45: Nextclade using Default tree", async ({ page }) => {
    const sc2_project = await projectPage.getOrCreateProject(`SC2-45_NextClade_CT20K_${WORKFLOWS.SC2}`);
    await setupSamples(
      page,
      sc2_project,
      CT20K_SAMPLE_FILES,
      CT20K_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      {hostOrganism: "Human", taxon: "Unknown", runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );

    // #region 1. Log in to Project
    await projectPage.navigateToMyData();
    // #endregion 1. Log in to Project

    // #region 2. Open [floo WGS1] Project
    await projectPage.navigateToSamples(sc2_project.id, WORKFLOWS.WGS);
    // #endregion 2. Open [floo WGS1] Project

    // #region 3. Navigate to Consensus Genome tab
    await projectPage.clickConsensusGenomeTab();
    // #endregion 3. Navigate to Consensus Genome tab

    // #region 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""
    const isNextcladeTreeButtonDisabledBefore = await projectPage.isNextcladeTreeButtonDisabled();
    expect(isNextcladeTreeButtonDisabledBefore).toEqual(true);

    await projectPage.clickSampleCheckbox(SAMPLE_1_PAIRED);

    // Nextclade phylo tree icon enables when selecting only SC2 samples
    const isNextcladeTreeButtonDisabledAfter = await projectPage.isNextcladeTreeButtonDisabled();
    expect(isNextcladeTreeButtonDisabledAfter).toEqual(false);
    // #endregion 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""

    // #region 5. Click on Nextclade tree icon
    await projectPage.clickNextcladeTreeButton();
    // #endregion 5. Click on Nextclade tree icon

    // #region 6. Select Nextclade Default Tree radio button
    await projectPage.clickNextcladeDefaultTree();
    // #endregion 6. Select Nextclade Default Tree radio button

    // #region 7. Click on ""View QC in Nextclade"" button
    await projectPage.clickViewQCInNextcladeButton();
    // #endregion 7. Click on ""View QC in Nextclade"" button

    // #region 8. Click on ""Confirm"" button in Nextclade (beta) window
    const nextcladePage = await projectPage.clickNextcladeConfirmButton();

    // New Nextclade tab window opens with Sample(s) selected listed and results table using Nextclade default tree
    const errorMessages = await projectPage.getErrorMessages();
    expect(errorMessages).toEqual([]);

    const nextcladeSampleNames = (await nextcladePage.getSampleNames()).sort();
    expect(nextcladeSampleNames).toEqual(CT20K_SAMPLE_NAMES);
    // #endregion 8. Click on ""Confirm"" button in Nextclade (beta) window
  });

  /*
   * Nextclade - Create a tree
   * Own Poject / .json tree file
   */
  test("SNo SC2-46: Nextclade uploading a reference .json tree file", async ({ page }) => {
    const sc2_project = await projectPage.getOrCreateProject(`SC2-46_NextClade_CT20K_${WORKFLOWS.SC2}`);
    await setupSamples(
      page,
      sc2_project,
      CT20K_SAMPLE_FILES,
      CT20K_SAMPLE_NAMES,
      WORKFLOWS.SC2,
      {hostOrganism: "Human", taxon: "Unknown", runPipeline: RUN_PIPELINE, waitForPipeline: WAIT_FOR_PIPELINE},
    );

    // #region 1. Login to CZ ID staging
    await projectPage.navigateToMyData();
    // #endregion 1. Login to CZ ID staging

    // #region 2. Open [floo WGS1] Project
    await projectPage.navigateToSamples(sc2_project.id, WORKFLOWS.WGS);
    // #endregion 2. Open [floo WGS1] Project

    // #region 3. Navigate to Consensus Genome tab
    await projectPage.clickConsensusGenomeTab();
    // #endregion 3. Navigate to Consensus Genome tab

    // #region 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""
    const isNextcladeTreeButtonDisabledBefore = await projectPage.isNextcladeTreeButtonDisabled();
    expect(isNextcladeTreeButtonDisabledBefore).toEqual(true);

    await projectPage.clickSampleCheckbox(SAMPLE_1_PAIRED);

    // Nextclade phylo tree icon enables when selecting only SC2 samples
    const isNextcladeTreeButtonDisabledAfter = await projectPage.isNextcladeTreeButtonDisabled();
    expect(isNextcladeTreeButtonDisabledAfter).toEqual(false);
    // #endregion 4. Select SC2 samples - ""Ct20K"", ""Sample_1_Paired""

    // #region 5. Click on Nextclade tree icon
    await projectPage.clickNextcladeTreeButton();
    // #endregion 5. Click on Nextclade tree icon

    // #region 6. Click on ""click to use a file browser"" box and select a valid .json tree file (See data section)
    await projectPage.clickUploadATree();

    // Nextclade reference .json file
    // https://drive.google.com/file/d/1xbB1Yp1nfMwSERYFM1MnSZEvoEjTWGsf/view?usp=sharing
    await projectPage.setUploadTreeInput(NEXTCLADE_REFERENCE_JSON_FILE);
    // #endregion 6. Click on ""click to use a file browser"" box and select a valid .json tree file (See data section)

    // #region 7. Select Upload a Tree radio button
    await projectPage.clickUploadATree();
    // #endregion 7. Select Upload a Tree radio button

    // #region 8. Click on ""View QC in Nextclade"" button
    await projectPage.clickViewQCInNextcladeButton();
    // #endregion 8. Click on ""View QC in Nextclade"" button

    // #region 9. Click on ""Confirm"" button in Nextclade (beta) window
    const nextcladePage = await projectPage.clickNextcladeConfirmButton();

    // New Nextclade tab window opens with Sample(s) selected listed and results table using referenced .json tree file"
    const errorMessages = await projectPage.getErrorMessages();
    expect(errorMessages).toEqual([]);

    const nextcladeSampleNames = (await nextcladePage.getSampleNames()).sort();
    expect(nextcladeSampleNames).toEqual(CT20K_SAMPLE_NAMES);
    // #endregion 9. Click on ""Confirm"" button in Nextclade (beta) window
  });

});
