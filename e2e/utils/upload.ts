import { expect, Page } from "@playwright/test";
import * as path from "path";
import dotenv from "dotenv";
import { Metadata } from "../types/metadata";
import { getFixture } from "./common";
import { findByTextRole, pressKey, selectFile } from "../utils/page";
import { getByTestID, getByText, getMetadataField } from "./selectors";
import {
  ACCEPT_ALL_COOKIES,
  ACCEPT_UPLOAD_TERMS,
  ANALYSIS_TYPE,
  CHECKBOX,
  COLLECTION_DATE,
  COLLECTION_LOCATION,
  COLUMN_SELECTOR,
  CONTINUE,
  DISEASES_CONDITIONS,
  FIXTURE_DIR,
  HOST_GENUS_SPECIES,
  HOST_ORGANISM,
  HOST_SEX,
  INFACTION_CLASS,
  ISOLATE,
  KNOWN_ORGANISM,
  NUMBER_INPUT,
  RNA_DNA,
  SAMPLE_TYPE,
  SEARCH,
  SELECT_PROJECT,
  START_UPLOAD,
  TEXT_INPUT,
  UPLOAD_METADATA,
} from "./constants";

dotenv.config({
  path: path.resolve(__dirname, "../../", `.env.${process.env.NODE_ENV}`),
});

const metadataFieldFixture = getFixture("metadata_fields");

export async function uploadSampleFiles(
  page: Page,
  projectName: string,
  analysisType: string,
  sampleFiles: Array<string>
): Promise<any> {
  // select project
  await page.locator(getByText(SELECT_PROJECT)).click();
  await (await findByTextRole(page, SEARCH)).fill(projectName);

  await page.locator(getByText(projectName)).click();

  // select analysis type
  const analysisTypeId = analysisType.toLowerCase().replace(/ /g, "-");
  await page.locator(getByTestID(`${ANALYSIS_TYPE}-${analysisTypeId}`)).click();

  //select files
  await selectFile(page, `${FIXTURE_DIR}/${sampleFiles}`);
  await page.locator(getByText(ACCEPT_ALL_COOKIES)).click();
  await page.locator(getByText(CONTINUE)).click();

  //wait for page and file data to be imported
  expect(page.locator(getByText(UPLOAD_METADATA))).toBeVisible();
}

export async function fillMetadata(
  page: Page,
  metaData: Metadata
): Promise<any> {
  // host organism
  await page.locator(TEXT_INPUT).nth(0).fill(String(metaData[HOST_ORGANISM]));

  // sample type
  await page.locator(TEXT_INPUT).nth(1).fill(String(metaData[SAMPLE_TYPE]));

  // water control
  if (metaData["Water Control"] === "Yes") {
    //todo: atm this crashes the test
    //await page.locator('input[type="radio"]').nth(0).click({ force: true });
  }
  // collection date
  await page
    .locator(TEXT_INPUT)
    .nth(2)
    .fill(metaData[COLLECTION_DATE] as string);

  //nucleotide type
  await page.locator(".dropdownTrigger-1fB9V").nth(1).click();
  await page.locator(getByText(metaData["Nucleotide Type"] as string)).click();

  //collection location
  await page
    .locator(TEXT_INPUT)
    .nth(3)
    .fill(metaData[COLLECTION_LOCATION] as string);
  await page
    .locator(getByText(metaData[COLLECTION_LOCATION] as string))
    .nth(0)
    .click();

  // first add optional columns so they can be filled
  const optionalFields: Array<string> =
    metadataFieldFixture["allOptinalFields"];
  //clicking the + icon
  await page.locator(getByTestID("select-columns")).click();
  const items = page.locator(COLUMN_SELECTOR);
  const indexOfFirstOptionalField = 5;
  for (let i = indexOfFirstOptionalField; i < (await items.count()); i++) {
    const optionName = (await items.nth(i).textContent()) as string;
    //this is a hack: at the moment we are not handling all optional fields
    if (optionalFields.includes(optionName)) {
      await items.nth(i).click();
    }
  }

  //close the column selection popup
  await pressKey(page, "Escape");

  // host sex
  const hostSex = "host_sex";
  await page.locator(getMetadataField(hostSex)).click();
  await page.locator(getByText(metaData[HOST_SEX] as string)).click();

  // known organism
  await page
    .locator(TEXT_INPUT)
    .nth(4)
    .fill(metaData[KNOWN_ORGANISM] as string);

  // infection class
  const infectaionClass = "infection_class";
  await page.locator(getMetadataField(infectaionClass)).click();
  await page.locator(getByText(metaData[INFACTION_CLASS] as string)).click();

  // host age
  await page.locator(NUMBER_INPUT).nth(0).fill(String(metaData["Host Age"]));

  // detection method
  await page
    .locator(TEXT_INPUT)
    .nth(5)
    .fill(metaData["Detection Method"] as string);

  // library prep
  await page.locator(getMetadataField("library_prep")).click();
  await page.locator(getByText(metaData["Library Prep"] as string)).click();

  // sequencer
  await page.locator(getMetadataField("sequencer")).click();
  await page.locator(getByText(metaData["Sequencer"] as string)).click();

  // rna/dna input (ng)
  await page.locator(NUMBER_INPUT).nth(1).fill(String(metaData[RNA_DNA]));

  //host genus species
  const hostGenusSpecies = "host_genus_species";
  await page.locator(getMetadataField(hostGenusSpecies)).click();
  await page.locator(getByText(metaData[HOST_GENUS_SPECIES] as string)).click();

  // isolate
  const isolate = "isolate";
  if (metaData[ISOLATE] === "Yes") {
    //at the moment this crashes the browser
    await page.locator(getMetadataField(isolate)).click();
  }

  // diseases and conditions
  await page
    .locator(TEXT_INPUT)
    .nth(6)
    .fill(String(metaData[DISEASES_CONDITIONS]));

  //click continue button
  const continueButtonIndex = 1;
  await page.locator(getByText(CONTINUE)).nth(continueButtonIndex).click();
}

export async function submitUpload(page: Page): Promise<any> {
  await page.locator(ACCEPT_UPLOAD_TERMS).click();
  await page.locator(getByText(START_UPLOAD)).click();
}
