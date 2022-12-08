import { expect, test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import {
  generateMetadataFile,
  getGeneratedSampleName,
  getMetadata,
} from "../../utils/sample";
import { Metadata } from "../../types/metadata";

import {
  fillMetadata,
  submitUpload,
  uploadSampleFiles,
} from "../../utils/upload";
import { getByTestID, getByText } from "../../utils/selectors";
import { fileChooser } from "../../utils/page";
import { CONTINUE, GO_TO_PROJECT, LOADED } from "../../utils/constants";

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
const projectName = "Test Project";
const sampleFiles = ["RR004_water_2_S23A_R1_001.fastq"];

test.describe("Metagenomics sample upload tests", () => {
  test.skip("Should upload mNGS sample with manual metadata", async ({
    page,
  }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await page.locator(getByTestID("menu-item-upload")).click();

    // upload files
    await uploadSampleFiles(page, projectName, sampleType, sampleFiles);

    // fill metadata
    const sampleName = (await getGeneratedSampleName(page)) as string;
    const metadata = getMetadata(sampleName, defaults);
    await fillMetadata(page, metadata);

    //submit
    await submitUpload(page);
  });

  test.skip("Should upload mNGS sample with metadata csv file", async ({
    page,
  }) => {
    await page.goto(`${process.env.BASEURL}/my_data`);
    await page.locator(getByTestID("menu-item-upload")).click();

    // upload files
    await uploadSampleFiles(page, projectName, sampleType, sampleFiles);
    await page.waitForTimeout(2000);

    const sampleName = (await page
      .locator(getByTestID("sample-name"))
      .textContent()) as string;
    //switch to csv upload
    await page.locator(getByText("CSV Upload")).click();

    //upload csv
    generateMetadataFile(sampleName, defaults);
    await fileChooser(page, `/tmp/${sampleName}.csv`);

    //sucessfull upload diologue
    expect(page.locator(getByText(LOADED))).toBeVisible();

    //click continue button
    const continueButtonIndex = 1;
    await page.locator(getByText(CONTINUE)).nth(continueButtonIndex).click();

    //submit upload
    await submitUpload(page);

    //complete upload process
    await page.locator(getByText(GO_TO_PROJECT)).click();
  });
});
