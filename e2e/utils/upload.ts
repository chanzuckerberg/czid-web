import path from "path";
import {
  ANALYSIS_TYPE,
  COLLECTION_DATE,
  COLLECTION_LOCATION,
  CONTINUE,
  FIXTURE_DIR,
  GO_TO_PROJECT,
  HOST_ORGANISM,
  LOADED,
  SAMPLE_TYPE,
  START_UPLOAD,
  UPLOAD_METADATA,
  WORKFLOWS,
} from "@e2e/constants/common";
import { Metadata } from "@e2e/types/metadata";
import { fileChooser } from "@e2e/utils/page";
import { expect, Page } from "@playwright/test";
import { kebabCase } from "lodash/fp";
import { updateMetadata } from "./metadata";

const REF_FILENAME = "consensus_papilloma.fa";
const CONTINUE_BUTTON = '[class *="continueButton"]';
const ONT = "sequencing-technology-ONT";

export const uploadRefSequence = async (page: Page) => {
  const REF_FILE = `./fixtures/reference_sequences/${REF_FILENAME}`;
  const [refSeqFileChooser] = await Promise.all([
    // It is important to call waitForEvent before click to set up waiting.
    page.waitForEvent("filechooser"),
    // Opens the file chooser.
    page.getByTestId("reference-sequence-file-upload").click(),
  ]);
  await page.waitForTimeout(2000);
  await refSeqFileChooser.setFiles(path.resolve(REF_FILE));
};

export async function uploadMetadata(
  page: Page,
  metadataTemplate: string,
): Promise<any> {
  // wait for page and file data to be imported
  expect(page.getByText(UPLOAD_METADATA)).toBeVisible();

  const sampleName = await getGeneratedSampleName(page);
  // switch to csv upload
  await page.getByText("CSV Upload").click();

  // create metadata file
  const metadataFile = updateMetadata(metadataTemplate, sampleName);

  // upload csv
  await fileChooser(page, metadataFile);

  // successful upload dialogue
  expect(page.getByText(LOADED).nth(1)).toBeVisible();
}

export async function getGeneratedSampleName(
  page: Page,
): Promise<string | null> {
  return page.getByTestId("sample-name").textContent();
}

export async function selectFiles(
  page: Page,
  selector: string,
  filePath: string,
  files: string[],
): Promise<any> {
  files.forEach(async sampleFile => {
    const fullPath = path.resolve(`${filePath}/${sampleFile}`);
    await page.setInputFiles(selector, fullPath);
  });
}

export async function uploadSampleFiles(
  page: Page,
  projectName: string,
  analysisType: string,
  sampleFiles: Array<string>,
  invalidSample?: boolean,
  verifyDeleteFile?: boolean,
  sequencingTechnology?: string,
): Promise<any> {
  const BASE_SPACE = "basespace";
  await cookieBanner(page);

  // search and select project
  await page
    .getByText("Select project", { exact: true })
    .click({ timeout: 10000 });
  await page.locator('input[placeholder="Search"]').type(projectName);
  await page.getByText(projectName).click();

  // without this upload fails
  await page.waitForTimeout(4000);

  // select analysis type
  const analysisTypeId = `${ANALYSIS_TYPE}-${kebabCase(analysisType)}`;
  const wgsWorkflowOption = page.getByTestId(analysisTypeId);
  await wgsWorkflowOption.click();

  if (analysisType === WORKFLOWS.MNGS) {
    // locator("..") gives us parent so we can click the checkbox
    await page.getByText("Illumina", { exact: true }).locator("..").click();
    // verify basespace and S3
    await expect(page.getByText("S3")).toBeEnabled();
    await expect(page.getByText("Basespace")).toBeEnabled();
  }

  if (analysisType === WORKFLOWS.WGS) {
    // choose a taxon name
    const taxonFilter = page.getByTestId("upload-taxon-filter");
    await taxonFilter.click();
    await page.getByText("Unknown").click();

    // upload a reference sequence
    await uploadRefSequence(page);

    // test file can be removed
    await page
      .getByTestId("clear-uploaded-file-button")
      .getByTestId("ClearIcon")
      .click();
    await expect(wgsWorkflowOption).not.toContainText(REF_FILENAME);

    // upload a reference sequence again
    await uploadRefSequence(page);

    // verify basespace
    await expect(page.getByTestId(BASE_SPACE)).toBeEnabled();
  }

  if (sequencingTechnology === WORKFLOWS.LMNGS) {
    await page.getByTestId(ONT).click();
    await expect(page.getByTestId(ONT)).toContainText(
      "Guppy Basecaller Setting",
    );
    // click the dropdown
    await page.getByTestId(ONT).getByTestId("filters").click();
    await expect(page.getByTestId("fast")).toBeVisible();
    await expect(page.getByTestId("hac")).toBeVisible();
    await expect(page.getByTestId("super")).toBeVisible();
    await page.getByTestId("super").click();

    // verify basespace
    await expect(page.getByTestId(BASE_SPACE)).toBeDisabled();
  }

  if (sequencingTechnology === WORKFLOWS.SC2) {
    await page.getByTestId("sequencing-technology-Illumina").click();
    // click the dropdown
    await page.getByTestId("filter-value").click();
    await page.getByText("VarSkip").click();
  }

  // select files
  const fileInputSelector = '[data-testid="drop-sample-files"] input';
  await selectFiles(page, fileInputSelector, FIXTURE_DIR, sampleFiles);

  // wait for upload to complete
  const fileConfirmation = `${sampleFiles.length} Files Selected For Upload`;
  await expect(page.getByText(fileConfirmation)).toBeVisible({
    timeout: 10000,
  });

  // verify user is able to click to remove unselected samples
  // check if the check box is checked then unchecked it
  if (verifyDeleteFile && !invalidSample) {
    if (await page.locator('input[value="all"]').isChecked()) {
      await page.getByTestId("check-box").first().click();
    }
    // remove the unselected sample
    await page.getByText("Click to remove unselected samples").click();

    // verify the sample is no longer displayed
    expect(await page.getByTestId("check-box").isVisible()).toBeFalsy();

    // re-upload the file
    await selectFiles(page, fileInputSelector, FIXTURE_DIR, sampleFiles);
  }
  if (invalidSample) {
    // except an error message to be displayed
    await expect(page.locator("div[class*='error']")).toContainText(
      "There are no valid samples available for upload",
    );
  }
}

export async function uploadInvalidSampleFiles(
  page: Page,
  projectName: string,
  analysisType: string,
  invalidSampleFiles: Array<string>,
  sequencingTechnology?: string,
): Promise<any> {
  // select project
  await page.getByTestId("select-project").click();
  // type in search box
  await page.locator('input[placeholder="Search"]').type(projectName);

  await page.getByText(projectName).click();
  await page.waitForTimeout(3000);

  // select analysis type
  const analysisTypeId = `${ANALYSIS_TYPE}-${kebabCase(analysisType)}`;
  const wgsWorkflowOption = page.getByTestId(analysisTypeId);
  await wgsWorkflowOption.click();

  if (
    analysisType === WORKFLOWS.MNGS &&
    sequencingTechnology !== WORKFLOWS.LMNGS
  ) {
    await page.getByTestId("sequencing-technology-Illumina").click();
  }
  if (sequencingTechnology === WORKFLOWS.LMNGS) {
    await page.getByTestId(ONT).click();
    await expect(page.getByTestId(ONT)).toContainText(
      "Guppy Basecaller Setting",
    );
    // click the dropdown
    await page.getByTestId(ONT).getByTestId("filters").click();
    await expect(page.getByTestId("fast")).toBeVisible();
    await expect(page.getByTestId("hac")).toBeVisible();
    await expect(page.getByTestId("super")).toBeVisible();
    await page.getByTestId("super").click();
  }
  if (analysisType === WORKFLOWS.WGS) {
    // choose a taxon name
    const taxonFilter = page.getByTestId("upload-taxon-filter");
    await taxonFilter.click();
    await page.getByText("Unknown").click();

    // upload a reference sequence
    await uploadRefSequence(page);

    // ensure filename displayed
    if (analysisType !== WORKFLOWS.WGS) {
      await expect(wgsWorkflowOption).toContainText(REF_FILENAME);
    }
  }

  await cookieBanner(page);
  // select files
  const fileInputSelector = '[data-testid="drop-sample-files"] input';
  const filePath = path.resolve(`${FIXTURE_DIR}/${invalidSampleFiles}`);

  await page.waitForTimeout(4000);
  await page.setInputFiles(fileInputSelector, filePath);
  // expect button to be disabled
  expect(
    await page
      .getByTestId("upload-continue-button")
      .locator("button")
      .isDisabled(),
  ).toBeTruthy();

  // except an error message to be displayed
  await expect(page.locator("div[class*='error']")).toContainText(
    "There are no valid samples available for upload",
  );
}

export async function isFieldEditable(
  page: Page,
  id: string,
): Promise<boolean> {
  const element = page.getByTestId(id);
  const divs = element.locator("input");
  if (
    element !== undefined &&
    divs !== undefined &&
    divs.first() !== undefined
  ) {
    const firstDivClass = await divs.first().getAttribute("class");
    if (
      firstDivClass !== null &&
      (firstDivClass.includes("hidden") || firstDivClass.includes("noInput"))
    ) {
      return false;
    } else {
      return true;
    }
  }
  return false;
}
export async function fillMetadata(
  page: Page,
  sampleType: string,
  metaData: Metadata,
): Promise<any> {
  // host organism
  const hostId = "host-organism";
  if (isFieldEditable(page, hostId)) {
    const hostOrganism = page.getByTestId(hostId);
    await hostOrganism.locator("input").fill(String(metaData[HOST_ORGANISM]));
  }

  // water control
  if (sampleType === "metagenomics") {
    const waterControlId = "water_control";
    if (
      metaData["Water Control"] === "Yes" &&
      isFieldEditable(page, waterControlId)
    ) {
      const waterControl = page.getByTestId(waterControlId);
      await waterControl.nth(0).click({ force: true });
    }
  }

  // collection location
  await page
    .getByTestId("collection_location_v2")
    .locator("input")
    .type(metaData[COLLECTION_LOCATION] as string);

  // click continue button
  await page.locator(CONTINUE_BUTTON).nth(1).click();
}

export async function fillIncompleteData(
  page: Page,
  metaData: Metadata,
): Promise<any> {
  // host organism
  await page
    .getByTestId("host-organism")
    .locator("input")
    .fill(String(metaData[HOST_ORGANISM]));

  // sample type
  await page
    .getByTestId("sample_type")
    .locator("input")
    .fill(String(metaData[SAMPLE_TYPE]));

  // collection date
  await page
    .getByTestId("collection_date")
    .locator("input")
    .fill(metaData[COLLECTION_DATE] as string);

  // click continue button
  await page.locator(CONTINUE_BUTTON).nth(1).click();

  // error message should be displayed
  await expect(page.locator("div[class*= 'issueGroup']:visible")).toContainText(
    "missing required metadata fields",
  );
}

export async function verifyAnalysisType(
  page: Page,
  analysisType: string,
): Promise<any> {
  const UPLOAD_REVIEW = "upload-input-review";
  if (analysisType === WORKFLOWS.MNGS) {
    expect(await page.getByTestId(UPLOAD_REVIEW).textContent()).toContain(
      "Metagenomics",
    );
    expect(await page.getByTestId(UPLOAD_REVIEW).textContent()).toContain(
      "Illumina",
    );
  }
  if (analysisType === WORKFLOWS.LMNGS) {
    expect(await page.getByTestId(UPLOAD_REVIEW).textContent()).toContain(
      "Metagenomics",
    );
    expect(await page.getByTestId(UPLOAD_REVIEW).textContent()).toContain(
      "Nanopore",
    );
  }

  if (analysisType === WORKFLOWS.AMR) {
    expect(await page.getByTestId(UPLOAD_REVIEW).textContent()).toContain(
      "Antimicrobial Resistance",
    );
  }
  await page.getByText("Continue").nth(1).click();
}
export async function submitUpload(page: Page): Promise<any> {
  // verify user is not able to upload without accepting terms and conditions
  expect(
    await page.locator("button").getByText(START_UPLOAD).isDisabled(),
  ).toBeTruthy();
  await page.getByTestId("terms-agreement-checkbox").click();
  expect(
    await page.locator("button").getByText(START_UPLOAD).isDisabled(),
  ).toBeFalsy();
  await page.getByText(START_UPLOAD).click();
}

export async function cookieBanner(page: Page): Promise<void> {
  const cookieBanner = page.locator(
    '[id="onetrust-accept-btn-handler"]:visible',
  );
  if ((await cookieBanner.count()) > 0) {
    await cookieBanner.click();
  }
}

export async function testUploadSample(
  page: Page,
  projectName: string,
  sampleType: string,
  sampleFiles: string[],
  invalidSample?: boolean,
  verifyDeleteFile?: boolean,
  metadataTemplate?: string,
  sequencingTechnology?: string,
): Promise<any> {
  // upload files
  await uploadSampleFiles(
    page,
    projectName,
    sampleType,
    sampleFiles,
    invalidSample,
    verifyDeleteFile,
    sequencingTechnology,
  );
  await page.getByText(CONTINUE).click();

  // wait for page and file data to be imported
  expect(page.getByText(UPLOAD_METADATA)).toBeVisible({ timeout: 10000 });

  if (
    metadataTemplate !== undefined &&
    (metadataTemplate.endsWith(".csv") || metadataTemplate.endsWith(".tsv"))
  ) {
    // upload metadata
    await uploadMetadata(page, metadataTemplate);
  } else {
    // todo: add scenario manual input
    await page.getByText("Auto-populate metadata (Admin-only)").click();
  }

  // verify analysis type on review page
  await verifyAnalysisType(page, sequencingTechnology);

  // submit
  await submitUpload(page);

  // assert no failure
  await expect(page.getByText("All uploads failed")).not.toBeVisible();

  // complete upload process
  await page.getByText(GO_TO_PROJECT).click({ timeout: 30000 });
}
