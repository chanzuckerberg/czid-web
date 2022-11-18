import { sample } from "lodash/fp";
import { Metadata } from "../types/metadata";
import {
  getAlphaNumericString,
  getAttributeOrDefault,
  getFixture,
  getRandomNumber,
  getYearMonthInThePast,
} from "./common";
import fs from "fs";
import { getByTestID } from "./selectors";
import { Page } from "@playwright/test";

const yesOrNo = ["Yes", "No"];
// metadata fixture will possible values
const metadataFixture = getFixture("metadata");

// collection of optional metadata fields and their data type
// helps to determine how to generate value of an optional field: select from list, generate randon number or string
const optionalFieldFixture = getFixture("metadata_fields");

// user can force field values, for testing specific attributes
let defaults: Metadata | undefined;

// metadada fields to be excluded (optional)
let excludedFields: Array<string> | undefined;

/**
 * Generates metadata for manual setup
 * @param sampleName, required
 * @param defaultData defaults values to set in the data
 * @param exclusions  list of fields to be optionally excluded
 * @returns Metadata object
 */
export function getMetadata(
  sampleName: string,
  defaultData?: Metadata,
  exclusions?: Array<string>,
): Metadata {
  defaults = defaultData;
  excludedFields = exclusions;
  return generateMetadata(sampleName);
}

/**
 * Generates metadata and writes to a CSV file; for testing upload with CSV metadata
 * @param defaultData defaults values to set in the data
 * @param exclusions  list of fields to be optionally excluded
 * @returns generated output file name
 */
export function generateMetadataFile(
  fileName: string,
  defaultData?: Metadata,
  exclusions?: Array<string>,
) {
  defaults = defaultData;
  excludedFields = exclusions;
  const data = generateMetadata(fileName);
  fs.writeFileSync(`/tmp/${fileName}.csv`, objToCsv(data));
}

/**
 * Helper function that generates the metadata
 * @param sampleName, required
 * @returns metadata object
 */
export function generateMetadata(sampleName: string): Metadata {
  let data: Metadata = {
    "Sample Name": sampleName,
    "Host Organism": getAttributeValue("Host Organism"),
    "Sample Type": getAttributeValue("Sample Type"),
    "Nucleotide Type": getAttributeValue("Nucleotide Type"),
    "Collection Date": getYearMonthInThePast(),
    "Water Control": sample(yesOrNo),
    "Collection Location": "New York",
  };
  return setOptionalMetadataAtrribute(data);
}

/**
 * Helper function that sets the values for all optional fields
 * Fields listed in 'excludedFields' constant will not be included
 * @param data - sample data object, should have required fields defined at this stage but can be added after
 * @returns Metadata object
 */
export function setOptionalMetadataAtrribute(data: Metadata): Metadata {
  const allOptionalFields = optionalFieldFixture["allOptinalFields"];
  for (const field of allOptionalFields) {
    if (!excludedFields?.includes(field)) {
      const attribute = field as string;
      data[attribute] = getAttributeValue(attribute);
    }
  }
  return data;
}

/**
 * Helper function that converts object in CSV format. This called before writing
 * metadata data to a CSV file
 * @param data - data to be converted
 * @returns - string representation of the CSV file with headers
 */
export function objToCsv(data) {
  const keys = Object.keys(data).join();
  const values = Object.values(data).join();
  return `${keys}\n${values}`;
}

/**
 * Helper function that sets the value of a metadata attribute.
 * It uses fixture data to determine the type of the attribue, for example if it needs to selected from a list.
 * Next it calls 'getAttributeOrDefault' function, which determines if a default value has been provided and
 * if not it generates a random value.
 * @param attribute
 * @returns
 */
export function getAttributeValue(attribute: string): any {
  const numberFields = optionalFieldFixture["numberFields"];
  const freeStyleFields = optionalFieldFixture["freeStyleFields"];
  const dropdownFields = optionalFieldFixture["dropdownFields"];
  const alphaNumericFields = optionalFieldFixture["alphaNumericFields"];

  let value: any;
  if (dropdownFields.includes(attribute)) {
    value = sample(metadataFixture[attribute]);
  } else if (numberFields.includes(attribute)) {
    value = getRandomNumber(2, 99);
  } else if (freeStyleFields.includes(attribute)) {
    value = getRandomNumber(2, 99);
  } else if (alphaNumericFields.includes(attribute)) {
    value = getAlphaNumericString(10);
  }
  return getAttributeOrDefault(defaults, attribute, value);
}

export async function getGeneratedSampleName(
  page: Page,
): Promise<string | null> {
  return page.locator(getByTestID("sample-name")).textContent();
}
