import path from "path";
import { expect, Locator, Page, test } from "@playwright/test";
import dotenv from "dotenv";
import { FIXTURE_DIR, WORKFLOWS } from "../../constants/common";
import { Metadata } from "../../types/metadata";
import { getMetadata } from "../../utils/mockData";
import {
  fillMetadata,
  getGeneratedSampleName,
  submitUpload,
  uploadRefSequence,
  uploadSampleFiles,
} from "../../utils/upload";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const SAMPLE_FILE = "RR004_water_2_S23A_R1_001.fastq";

const defaults: Metadata = {
  "Host Organism": "Madagascan Rousettes",
  "Sample Type": "Plasma",
  "Collection Date": "2022-10",
  "Water Control": "No",
  "Host Age": 43,
  "Host ID": "jeNhTLicCl",
  "RNA/DNA Input (ng)": 97,
  "Host Genus Species": "Aedes aegypti",
  "Ct Value": 97,
};

type WORKFLOW_KEYS = keyof typeof WORKFLOWS;
type WORKFLOW_VALUES = (typeof WORKFLOWS)[WORKFLOW_KEYS];

const getCheckboxForWorkflow = async ({
  page,
  workflow,
}: {
  page: Page;
  workflow: WORKFLOW_VALUES;
}): Promise<Locator> => {
  return page.getByTestId(`analysis-type-${workflow}`).locator("input");
};

test.describe("upload flow tests", () => {
  // you should be able to upload to multiple workflows at a time
  // these are the allowed combos
  const allowedUploadPairs = [
    [WORKFLOWS.MNGS, WORKFLOWS.AMR],
    [WORKFLOWS.MNGS, WORKFLOWS.WGS],
  ];

  for (const testPair of allowedUploadPairs) {
    test(`workflows ${testPair.join(", ")} can be run together`, async ({
      page,
    }) => {
      await page.goto(`${process.env.BASEURL}/samples/upload`);

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

  // we should also check that disallowed workflow combos aare disabled.
  // these are the disallowed combos
  const disallowedUploadPairs = [
    [WORKFLOWS.MNGS, WORKFLOWS.SC2],
    [WORKFLOWS.AMR, WORKFLOWS.WGS],
    [WORKFLOWS.AMR, WORKFLOWS.SC2],
    [WORKFLOWS.WGS, WORKFLOWS.SC2],
  ];

  for (const testPair of disallowedUploadPairs) {
    test(`workflows ${testPair.join(", ")} cannot be run together`, async ({
      page,
    }) => {
      await page.goto(`${process.env.BASEURL}/samples/upload`);

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
});

test("WGS workflow option happy path", async ({ page }) => {
  await page.goto(`${process.env.BASEURL}/samples/upload`);
  // choose project and upload sample files
  const sampleType = WORKFLOWS.WGS;
  const projectName = "New QA Project";
  const sampleFiles = [SAMPLE_FILE];
  await uploadSampleFiles(page, projectName, sampleType, sampleFiles);

  // fill metadata
  const sampleName = (await getGeneratedSampleName(page)) as string;
  const metadata = getMetadata(sampleName, defaults);
  await fillMetadata(page, metadata);

  // check analysis type info shows:
  // sequencing platform, taxon, ref seq file name, trim primer (if uploaded), and pipeline version
  const analysisReview = await page.getByTestId("upload-input-review");
  expect(analysisReview).toContainText("Viral Consensus Genome");
  expect(analysisReview).toContainText("Illumina");
  expect(analysisReview).toContainText("papilloma"); // ref file name
  expect(analysisReview).toContainText("unknown");
  expect(analysisReview).toContainText("None provided");

  // submit
  await submitUpload(page);
});

test("WGS allows uploads basespace, locally", async ({ page }) => {
  await page.goto(`${process.env.BASEURL}/samples/upload`);

  const checkbox = await getCheckboxForWorkflow({
    page,
    workflow: WORKFLOWS.WGS,
  });
  await checkbox.click();

  const local = await page.getByTestId("upload-from-your-computer");
  const basespace = await page.getByTestId("upload-from-basespace");

  expect(local).toBeEnabled();
  expect(basespace).toBeEnabled();
});

test("user cannot continue unless all required wgs fields completed", async ({
  page,
}) => {
  // we need to find the tooltip again every time we hover the continue button because the
  // DOM element is destroyed and recreated each time, so the pointer gets destroyed too.
  // That's why this helper exists.
  const getUploadTooltip = async () => {
    return page.getByTestId("upload-continue-tooltip");
  };

  await page.goto(`${process.env.BASEURL}/samples/upload`);

  const continueButton = await page
    .getByTestId("upload-continue-button")
    .locator("button");

  // check text and button disabled status for various invalid conditions
  // no project chosen
  await continueButton.hover({ force: true });
  let tooltip = await getUploadTooltip();
  await expect(tooltip).toContainText("select a project");
  await expect(continueButton).toBeDisabled();

  // choose a project
  await page.getByTestId("select-project").click();
  await page.getByTestId("dropdown-qa-project").click(); // the qa test project

  // no workflow selected
  await continueButton.hover({ force: true });
  tooltip = await getUploadTooltip();
  await expect(tooltip).toContainText("select an analysis type");
  await expect(continueButton).toBeDisabled();

  // choose workflow
  const wgsWorkflowOption = await getCheckboxForWorkflow({
    page,
    workflow: WORKFLOWS.WGS,
  });
  await wgsWorkflowOption.click();

  // no taxon chosen
  await continueButton.hover({ force: true });
  tooltip = await getUploadTooltip();
  await expect(tooltip).toContainText("select a taxon");
  await expect(continueButton).toBeDisabled();

  // choose a taxon
  const taxonFilter = await page.getByTestId("upload-taxon-filter");
  await taxonFilter.click();
  await page.getByText("Unknown").click();

  // no ref file uploaded
  await continueButton.hover({ force: true });
  tooltip = await getUploadTooltip();
  await expect(tooltip).toContainText("upload a reference sequence");
  await expect(continueButton).toBeDisabled();

  // upload a ref file
  await uploadRefSequence(page);

  // no samples uploaded
  await continueButton.hover({ force: true });
  tooltip = await getUploadTooltip();
  await expect(tooltip).toContainText("select a sample");
  await expect(continueButton).toBeDisabled();

  // upload samples
  const samplesFileChooserPromise = page.waitForEvent("filechooser");
  await page.getByTestId("drop-sample-files").click();
  const samplesFileChooser = await samplesFileChooserPromise;
  await samplesFileChooser.setFiles(
    path.resolve(`${FIXTURE_DIR}/${SAMPLE_FILE}`),
  );

  await continueButton.hover({ force: true });
  tooltip = await getUploadTooltip();
  await expect(await tooltip.count()).toEqual(0);
  await expect(continueButton).toBeEnabled();
});
