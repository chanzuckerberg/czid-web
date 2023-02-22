import { expect, Page, test } from "@playwright/test";
import { getByTestID } from "../utils/selectors";

const baseUrl = process.env.BASEURL as string;

const expectAnalysisTypeToBeEnabled = async (
  page: Page,
  analysisType: string,
) => {
  await expect(
    page.locator(getByTestID(`analysis-type-${analysisType}`)),
  ).toBeEnabled();
};

const expectAnalysisTypeToBeDisabled = async (
  page: Page,
  analysisType: string,
) => {
  await expect(
    await page
      .locator(getByTestID(`analysis-type-${analysisType}`))
      .getAttribute("class"),
  ).toContain("disabled");
};

test.describe("WorkflowSelector tests", () => {
  test("Should disable incompatable workflows and upload options when Metagenomics workflow is selected", async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/samples/upload`);

    // 1a. Select Metagenomics workflow
    await page.locator(getByTestID("analysis-type-metagenomics")).click();

    // 1b. Expect compatible workflows to be enabled
    expectAnalysisTypeToBeEnabled(page, "antimicrobial-resistance");
    expectAnalysisTypeToBeDisabled(page, "sars-co-v-2-consensus-genome");

    // 1c. Expect all upload options to be enabled
    await expect(
      page.locator(getByTestID("upload-from-your-computer")),
    ).toBeEnabled();
    await expect(
      page.locator(getByTestID("upload-from-basespace")),
    ).toBeEnabled();

    // 2a. Select Nanopore technology
    await page.locator(getByTestID("sequencing-technology-ont")).click();

    // 2b. Expect all other workflows to be disabled
    expectAnalysisTypeToBeDisabled(page, "antimicrobial-resistance");
    expectAnalysisTypeToBeDisabled(page, "sars-co-v-2-consensus-genome");

    // 2c. Expect only local upload option to be enabled
    await expect(
      page.locator(getByTestID("upload-from-your-computer")),
    ).toBeEnabled();
    await expect(
      page.locator(getByTestID("upload-from-basespace")),
    ).toBeDisabled();

    // 3a. Select Illumina technology
    await page.locator(getByTestID("sequencing-technology-illumina")).click();

    // 3b. Expect compatible workflows to be enabled
    expectAnalysisTypeToBeEnabled(page, "antimicrobial-resistance");
    expectAnalysisTypeToBeDisabled(page, "sars-co-v-2-consensus-genome");

    // 3c. Expect all upload options to be enabled
    await expect(
      page.locator(getByTestID("upload-from-your-computer")),
    ).toBeEnabled();
    await expect(
      page.locator(getByTestID("upload-from-basespace")),
    ).toBeEnabled();
  });

  test("Should disable incompatable workflows and upload options when Consensus Genomes is selected", async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/samples/upload`);

    // 1a. Select Consensus Genomes workflow
    await page
      .locator(getByTestID("analysis-type-sars-co-v-2-consensus-genome"))
      .click();

    // 1b. Expect all other workflows to be disabled
    expectAnalysisTypeToBeDisabled(page, "metagenomics");
    expectAnalysisTypeToBeDisabled(page, "antimicrobial-resistance");

    // 1c. Expect all upload options to be enabled
    await expect(
      page.locator(getByTestID("upload-from-your-computer")),
    ).toBeEnabled();
    await expect(
      page.locator(getByTestID("upload-from-basespace")),
    ).toBeEnabled();

    // 2a. Select Nanopore technology
    await page.locator(getByTestID("sequencing-technology-ont")).click();

    // 2b. Expect all other workflows to be disabled
    expectAnalysisTypeToBeDisabled(page, "metagenomics");
    expectAnalysisTypeToBeDisabled(page, "antimicrobial-resistance");

    // 2c. Expect only local upload option to be enabled
    await expect(
      page.locator(getByTestID("upload-from-your-computer")),
    ).toBeEnabled();
    await expect(
      page.locator(getByTestID("upload-from-basespace")),
    ).toBeDisabled();

    // 3a. Select Illumina technology
    await page.locator(getByTestID("sequencing-technology-illumina")).click();

    // 3b. Expect all other workflows to be disabled
    expectAnalysisTypeToBeDisabled(page, "metagenomics");
    expectAnalysisTypeToBeDisabled(page, "antimicrobial-resistance");

    // 3c. Expect all upload options to be enabled
    await expect(
      page.locator(getByTestID("upload-from-your-computer")),
    ).toBeEnabled();
    await expect(
      page.locator(getByTestID("upload-from-basespace")),
    ).toBeEnabled();
  });
});

test("Should disable incompatable workflows and upload options when AMR is selected", async ({
  page,
}) => {
  await page.goto(`${baseUrl}/samples/upload`);

  // Select AMR workflow
  await page
    .locator(getByTestID("analysis-type-antimicrobial-resistance"))
    .click();

  // Expect compatible workflows to be enabled
  expectAnalysisTypeToBeEnabled(page, "metagenomics");
  expectAnalysisTypeToBeDisabled(page, "sars-co-v-2-consensus-genome");

  // Expect all upload options to be enabled
  await expect(
    page.locator(getByTestID("upload-from-your-computer")),
  ).toBeEnabled();
  await expect(
    page.locator(getByTestID("upload-from-basespace")),
  ).toBeEnabled();
});
