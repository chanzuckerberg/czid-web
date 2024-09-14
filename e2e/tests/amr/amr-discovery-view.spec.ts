import { CZID_TEST_ACCOUNT_USER_NAME, WORKFLOWS } from "@e2e/constants/common";
import { E_COLI_AADS_R1, E_COLI_AADS_R2, E_COLI_AADS_SAMPLE_NAME } from "@e2e/constants/sample";
import { ProjectPage } from "@e2e/page-objects/project-page";
import { setupSamples } from "@e2e/page-objects/user-actions";
import moment from 'moment-timezone'
import { test, expect } from "@playwright/test";

const PROJECT_NAME_SUFFIX = "ecoli_aadS"

const TEST_TIMEOUT = 60 * 1000 * 20;
const PROJECT_CREATION_TIMEOUT = 60 * 1000 * 2;

const RUN_PIPELINE = false;
const WAIT_FOR_PIPELINE = false;

let project = null;
let projectPage = null;
let samples = [];

const SAMPLE_NAMES_TO_WAIT_FOR = [E_COLI_AADS_SAMPLE_NAME];

const PASSED_FILTERS_MAX_DIFF = 1000;
const TOTAL_READS_MAX_DIFF = 1000;

const expectedSampleInfo ={
  sample: [
    "e_coli_aadS_r0.00",
    "COMPLETE",
    "CZ ID Test Account|czid-e2e_automation_project_amr_ecoli_aadS"
  ],
  host: "Unknown",
  passedFilters: [ "926,918", "99.83%" ],
  totalReads: "928,500",
}

const parseDataToFloat = (data: string): number => {
  return parseFloat(data.replace(",", ""));
};

const getAmrProjectName = (): string => {
  const projectDate = moment().format("YYYYMM");
  return `automation_project_${WORKFLOWS.AMR}_${PROJECT_NAME_SUFFIX}_${projectDate}`;
}

test.describe("AMR Discovery View for E Coli aadS sample", () => {
  // A new project and sample should be created once per month, to test the latest version of the pipeline
  // The first test is the only one that performs the sample upload, to prevent the pipeline from running multiple times
  test.describe("Create project and sample", () => {
    test.beforeAll(async ({ browser }) => {
      test.setTimeout(TEST_TIMEOUT);

      // #region Setup project
      const page = await browser.newPage();
      projectPage = new ProjectPage(page);
      project = await projectPage.getOrCreateProject(getAmrProjectName());
      // #endregion Setup project

      // #region Setup samples
      samples = await setupSamples(
        page,
        project,
        [E_COLI_AADS_R1, E_COLI_AADS_R2],
        [E_COLI_AADS_SAMPLE_NAME],
        WORKFLOWS.AMR,
        {
          hostOrganism: "Unknown",
          runPipeline: RUN_PIPELINE,
          waitForPipeline: WAIT_FOR_PIPELINE,
        },
      );
      // #endregion Setup samples

      await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.AMR, SAMPLE_NAMES_TO_WAIT_FOR, TEST_TIMEOUT);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
      await projectPage.clickAntimicrobialTab();
    });

    test("SNo 1: Create sample and run pipeline", async () => {
      const sampleName = (await projectPage.selectCompletedSamples(1))[0];
      expect(sampleName.startsWith(E_COLI_AADS_SAMPLE_NAME)).toBeTruthy();
    });
  });

  // These tests do not upload the sample, and only check data displayed in the discovery view
  test.describe("Check data in discovery view", () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(TEST_TIMEOUT);

      // #region Check that project exists or wait for project to be created
      projectPage = new ProjectPage(page);
      const projectNameForUser = projectPage.getProjectNameForUser(getAmrProjectName());
      project = await projectPage.getProjectByName(projectNameForUser);

      const startTime = Date.now();
      // Project timeout is shorter than test timeout, as we do not want to block if there is an issue creating project / uploading sample
      while (!project && (Date.now() - startTime) < PROJECT_CREATION_TIMEOUT) {
        // When a new project and sample are being created, if the project does not exist, wait sufficient time
        // for project to be created and sample upload to begin
        await projectPage.pause(30);
        project = await projectPage.getProjectByName(projectNameForUser);
      }
      expect(project).not.toBeNull();
      // #endregion Check that project exists or wait for project to be created

      // #region Check if there is a sample, and if not, reload project
      // When a new project and sample are being created, there is a possible race condition
      // where the project is created but sample upload has not started yet
      await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
      const amrSampleCount = await projectPage.getAntimicrobialTabCount();
      if (amrSampleCount === 0) {
        await projectPage.pause(30);
        await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
      }
      // #endregion Check if there is a sample, and if not, reload project

      // #region Wait for samples to be completed and navigate to AMR tab
      await projectPage.waitForSamplesComplete(project.id, WORKFLOWS.AMR, SAMPLE_NAMES_TO_WAIT_FOR, TEST_TIMEOUT);
      await projectPage.navigateToSamples(project.id, WORKFLOWS.AMR);
      await projectPage.clickAntimicrobialTab();
      // #endregion Wait for samples to be created and navigate to AMR tab
    });

    test("SNo 2: Verify displayed sample counts are correct", async () => {
      // Check Sample headers count is 1
      const sampleTabCount = await projectPage.getSamplesTabCount();
      expect(sampleTabCount).toBe(1);

      // Check Antimicrobial resistance tab count is 1
      const amrTabCount = await projectPage.getAntimicrobialTabCount();
      expect(amrTabCount).toBe(1);
    });

    test("SNo 3: Verify sample passed filters value", async () => {
      const sampleTable = await projectPage.getSamplesTable();
      expect(sampleTable.length).toBe(1);

      // #region Get actual and expected passed filters info
      const sampleInfo = sampleTable[0];
      const [passedFiltersStr, passedFiltersPct] = sampleInfo["Passed Filters"];
      const [expectedPassedFiltersStr, expectedPassedFiltersPct] = expectedSampleInfo.passedFilters;
      // #endregion Get actual and expected passed filters info

      // #region Verify passed filters count falls in expected range
      const passedFiltersValue = parseDataToFloat(passedFiltersStr);
      const expectedPassedFiltersValue = parseDataToFloat(expectedPassedFiltersStr);

      expect(Math.abs(passedFiltersValue - expectedPassedFiltersValue)).toBeLessThanOrEqual(PASSED_FILTERS_MAX_DIFF);
      // #endregion Verify passed filters count falls in expected range

      expect(passedFiltersPct).toEqual(expectedPassedFiltersPct);
    });

    test("SNo 4: Verify sample total reads value", async () => {
      const sampleTable = await projectPage.getSamplesTable();
      expect(sampleTable.length).toBe(1);

      // #region Get actual and expected total reads info
      const sampleInfo = sampleTable[0];
      const totalReads = sampleInfo["Total Reads"];
      const totalReadsValue = parseDataToFloat(totalReads);
      const expectedTotalReadsValue = parseDataToFloat(expectedSampleInfo.totalReads);
      // #endregion Get actual and expected total reads info

      expect(Math.abs(expectedTotalReadsValue - totalReadsValue)).toBeLessThanOrEqual(TOTAL_READS_MAX_DIFF);
    });

    test("SNo 5: Verifier sample upload name", async () => {
      const sampleTable = await projectPage.getSamplesTable();
      expect(sampleTable.length).toBe(1);

      const sampleRow = sampleTable[0];
      const sampleInfo = sampleRow["Sample"];
      const sampleUser = sampleInfo[2].split("|")[0];

      expect(sampleUser).toEqual(CZID_TEST_ACCOUNT_USER_NAME);
    });
  });
});
