import path from "path";
import { expect, test } from "@playwright/test";
import dotenv from "dotenv";
import { CONTINUE, GO_TO_PROJECT, LOADED } from "../../constants/common.const";
import { Metadata } from "../../types/metadata";
import { generateMetadataFile, getMetadata } from "../../utils/mockData";
import { fileChooser } from "../../utils/page";
import {
  fillMetadata,
  getGeneratedSampleName,
  submitUpload,
  uploadSampleFiles,
} from "../../utils/upload";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

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

const sampleType = "Metagenomics";
const projectName = "New QA Project";
const sampleFiles = ["RR004_water_2_S23A_R1_001.fastq"];
// These tests verify user is able to upload metadata samples manually and via csv file.
test.describe("Metagenomics sample upload tests", () => {
  test("Should upload mNGS sample with manual metadata", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await page.getByTestId("menu-item-upload").click();

    // upload files
    await uploadSampleFiles(page, projectName, sampleType, sampleFiles);

    // fill metadata
    const sampleName = (await getGeneratedSampleName(page)) as string;
    const metadata = getMetadata(sampleName, defaults);
    await fillMetadata(page, metadata);

    // submit
    await submitUpload(page);
  });

  test("Should upload mNGS sample with metadata csv file", async ({ page }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await page.getByTestId("menu-item-upload").click();

    // upload files
    await uploadSampleFiles(page, projectName, sampleType, sampleFiles);
    await page.waitForTimeout(2000);

    const sampleName = (await page
      .getByTestId("sample-name")
      .textContent()) as string;
    // switch to csv upload
    await page.getByText("CSV Upload").click();

    // upload csv
    generateMetadataFile(sampleName, defaults);
    await fileChooser(page, `/tmp/${sampleName}.csv`);

    // successful upload dialogue
    expect(page.getByText(LOADED).nth(1)).toBeVisible();

    // click continue button
    const continueButtonIndex = 1;
    await page
      .getByText(CONTINUE)
      .nth(continueButtonIndex)
      .click();

    // submit upload
    await submitUpload(page);

    // complete upload process
    await page.getByText(GO_TO_PROJECT).click();
  });
});
