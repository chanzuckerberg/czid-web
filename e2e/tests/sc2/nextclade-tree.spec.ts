import { WORKFLOWS } from "@e2e/constants/common";
import { SAMPLE_FILE_NO_HOST_1, SAMPLE_FILE_NO_HOST_2 } from "@e2e/constants/sample";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
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
 * NextClade Tree
 */
test.describe("NextClade Tree: Functional: P-0", () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(timeout);
    projectPage = new ProjectPage(page);
    sc2_project = await projectPage.getOrCreateProject(`NextClade_${WORKFLOWS.SC2}`);
  });

  test("SNo 23: Create a Nextclade Tree", async ({ page }) => {
    await runPipelineIfNeeded(page, sc2_project.name, "Human", "Unknown");

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
    await runPipelineIfNeeded(page, sc2_project.name, "Human", "Unknown");

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
});

async function runPipelineIfNeeded(page: any, projectName: string, hostOrganism: string, taxon: string) {
  const samplesPage = new SamplesPage(page);

  let samples = [];
  let ranPipeline = false;
  const noHostSample = await samplesPage.getSamples(sc2_project.name, SARS_CoV2_SAMPLE_NAMES[0]);
  if ((noHostSample.length <= 0) || RUN_PIPELINE) {
    const uploadPage = new UploadPage(page);
    const sampleNames = [];
    const inputs = await uploadPage.getRandomizedSampleInputs(WGS_SAMPLE_FILES, SARS_CoV2_SAMPLE_NAMES);
    for (const sampleName of Object.keys(inputs)) {
      sampleNames.push(sampleName);
      inputs[sampleName].hostOrganism = hostOrganism;
    }
    await uploadPage.e2eCSVSampleUpload(WGS_SAMPLE_FILES, sc2_project, WORKFLOWS.SC2, inputs, true, taxon);
    samples = await samplesPage.getSamples(sc2_project.name, sampleNames);
    ranPipeline = true;
  }

  if (ranPipeline && WAIT_FOR_PIPELINE) {
    test.setTimeout(60 * 1000 * 20); // Inclease the test runtime to let the piepline run
    const sampleIds = samples.map(sample => sample.id);
    await samplesPage.waitForAllSamplesComplete(sampleIds);
  }
}
