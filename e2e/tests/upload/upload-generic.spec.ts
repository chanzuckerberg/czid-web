import {
  CONTINUE,
  FIXTURE_DIR,
  UPLOAD_METADATA,
  WORKFLOWS,
} from "@e2e/constants/common";
import {
  SAMPLE_FILE_R1,
  SAMPLE_FILE_R2,
  TEST_PROJECTS,
} from "@e2e/constants/sample";
import {
  cookieBanner,
  selectFiles,
  uploadRefSequence,
  uploadSampleFiles,
} from "@e2e/utils/upload";
import { expect, Locator, Page, test } from "@playwright/test";

type WORKFLOW_KEYS = keyof typeof WORKFLOWS;
type WORKFLOW_VALUES = (typeof WORKFLOWS)[WORKFLOW_KEYS];
const ENV = (process.env.NODE_ENV as string) || "";
const projectName = TEST_PROJECTS[ENV.toUpperCase()];
const SAMPLE_FILES = [SAMPLE_FILE_R1, SAMPLE_FILE_R2];
const getCheckboxForWorkflow = async ({
  page,
  workflow,
}: {
  page: Page;
  workflow: WORKFLOW_VALUES;
}): Promise<Locator> => {
  return page.getByTestId(`analysis-type-${workflow}`).locator("input");
};

// you should be able to upload to multiple workflows at a time
// these are the allowed combos
const allowedUploadPairs = [
  [WORKFLOWS.MNGS, WORKFLOWS.AMR],
  [WORKFLOWS.MNGS, WORKFLOWS.WGS],
];

// we should also check that disallowed workflow combos are disabled.
// these are the disallowed combos
const disallowedUploadPairs = [
  [WORKFLOWS.MNGS, WORKFLOWS.SC2],
  [WORKFLOWS.AMR, WORKFLOWS.WGS],
  [WORKFLOWS.AMR, WORKFLOWS.SC2],
  [WORKFLOWS.WGS, WORKFLOWS.SC2],
];

// These are generic upload tests not specific to workflows
test.describe("Generic upload flow tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/samples/upload`);
    await cookieBanner(page);
  });

  for (const testPair of allowedUploadPairs) {
    test(`Should run combination of ${testPair.join(
      ", ",
    )} workflow combination `, async ({ page }) => {
      const [analysisType1, analysisType2] = testPair;
      const firstCheckbox = await getCheckboxForWorkflow({
        page,
        workflow: analysisType1,
      });
      await firstCheckbox.click();

      const secondCheckbox = await getCheckboxForWorkflow({
        page,
        workflow: analysisType2,
      });
      expect(secondCheckbox).toBeEnabled();
    });
  }

  for (const testPair of disallowedUploadPairs) {
    test(`Should not allow ${testPair.join(
      ", ",
    )} workflow combination`, async ({ page }) => {
      const [analysisType1, analysisType2] = testPair;
      const firstCheckbox = await getCheckboxForWorkflow({
        page,
        workflow: analysisType1,
      });
      await firstCheckbox.click();

      const secondCheckbox = await getCheckboxForWorkflow({
        page,
        workflow: analysisType2,
      });
      expect(secondCheckbox).toBeDisabled();
    });
  }

  test("Should verify analysis info", async ({ page }) => {
    // choose project and upload sample files
    const sampleType = WORKFLOWS.WGS.toLowerCase();
    await uploadSampleFiles(page, projectName, sampleType, SAMPLE_FILES);

    await page.getByText(CONTINUE).click();

    // wait for page and file data to be imported
    expect(page.getByText(UPLOAD_METADATA)).toBeVisible({ timeout: 10000 });

    await page.getByText("Auto-populate metadata (Admin-only)").click();

    await page.getByText(CONTINUE).nth(1).click();
    await page.waitForTimeout(2000);

    // check analysis type info shows:
    // sequencing platform, taxon, ref seq file name, trim primer (if uploaded), and pipeline version
    const analysisReview = page.getByTestId("upload-input-review");
    expect(analysisReview).toContainText("Viral Consensus Genome");
    expect(analysisReview).toContainText("Illumina");
    expect(analysisReview).toContainText("papilloma"); // ref file name
    expect(analysisReview).toContainText("unknown");
    expect(analysisReview).toContainText("None provided");
  });

  test("Should upload with local basespace", async ({ page }) => {
    const checkbox = await getCheckboxForWorkflow({
      page,
      workflow: WORKFLOWS.WGS,
    });
    await checkbox.click();
    const local = page.getByTestId("your-computer");
    const basespace = page.getByTestId("basespace");
    expect(local).toBeEnabled();
    expect(basespace).toBeEnabled();
  });

  test("Should force user to complete all required wgs fields", async ({
    page,
  }) => {
    // we need to find the tooltip again every time we hover the continue button because the
    // DOM element is destroyed and recreated each time, so the pointer gets destroyed too.
    // That's why this helper exists.
    const getUploadTooltip = async () => {
      return page.getByTestId("upload-continue-tooltip");
    };

    const continueButton = page
      .getByTestId("upload-continue-button")
      .locator("button");
    await cookieBanner(page);
    // check text and button disabled status for various invalid conditions
    // no project chosen
    await continueButton.click({ force: true });
    let tooltip = await getUploadTooltip();
    await expect(tooltip).toContainText("Please select a project to continue");
    await expect(continueButton).toBeDisabled();

    // choose a project
    await page
      .getByText("Select project", { exact: true })
      .click({ timeout: 10000 });
    await page.locator('input[placeholder="Search"]').type(projectName);
    await page.getByText(projectName).click();

    // no workflow selected
    await continueButton.click({ force: true });
    tooltip = await getUploadTooltip();
    await expect(tooltip).toContainText(
      "Please select an analysis type to continue",
    );
    await expect(continueButton).toBeDisabled();

    // choose workflow
    const wgsWorkflowOption = await getCheckboxForWorkflow({
      page,
      workflow: WORKFLOWS.WGS,
    });
    await wgsWorkflowOption.click();

    // no taxon chosen
    await continueButton.click({ force: true });
    tooltip = await getUploadTooltip();
    await expect(tooltip).toContainText("Please select a taxon to continue");
    await expect(continueButton).toBeDisabled();

    // choose a taxon
    const taxonFilter = await page.getByTestId("upload-taxon-filter");
    await taxonFilter.click();
    await page.getByText("Unknown").click();

    // no ref file uploaded
    await continueButton.click({ force: true });
    tooltip = await getUploadTooltip();
    await expect(tooltip).toContainText("upload a reference sequence");
    await expect(continueButton).toBeDisabled();

    // upload a ref file
    await uploadRefSequence(page);

    // no samples uploaded
    await continueButton.click({ force: true });
    tooltip = await getUploadTooltip();
    await expect(tooltip).toContainText("Please select a sample to continue");
    await expect(continueButton).toBeDisabled();

    // upload samples
    const fileInputSelector = '[data-testid="drop-sample-files"] input';
    await selectFiles(page, fileInputSelector, FIXTURE_DIR, SAMPLE_FILES);
    await page.waitForTimeout(2000);
    await continueButton.click({ force: true });
    tooltip = await getUploadTooltip();
    expect(await tooltip.count()).toEqual(0);
    await expect(continueButton).toBeEnabled();
  });
});
