import * as faker from "@faker-js/faker";
import { sample } from "lodash/fp";
import { AnalysisTypes } from "../types/analysisTypes";
import { Metadata } from "../types/metadata";
import {
  getAlphaNumericString,
  getAttributeOrDefault,
  getFixture,
  getRandomNumber,
  getYearMonthInThePast,
} from "./common";
import fs from "fs";

const yesOrNo = ["Yes", "No"];
// metadata fixture will possible values
const metadataFixture = getFixture("metadata");

// collection of optional metadata fields and their data type
// helps to determine how to generate value of an optional field: select from list, generate randon number or string
const optionalFieldFixture = getFixture("optional_metadata_fields");

// user can force field values, for testing specific attributes
let defaults: Metadata | undefined;

// metadada fields to be excluded (optional)
let excludedFields: Array<string> | undefined;

/**
 * Generates metadata for manual setup
 * @param analysisType, required - should be one of the three analysis types
 * @param defaultData defaults values to set in the data
 * @param exclusions  list of fields to be optionally excluded
 * @returns Metadata object
 */
export function getMetadata(
  analysisType: keyof typeof AnalysisTypes,
  defaultData?: Metadata,
  exclusions?: Array<string>,
): Metadata {
  defaults = defaultData;
  excludedFields = exclusions;
  return generateMetadata(analysisType);
}

/**
 * Generates metadata and writes to a CSV file; for testing upload with CSV metadata
 * @param analysisType, required - should be one of the three analysis types
 * @param defaultData defaults values to set in the data
 * @param exclusions  list of fields to be optionally excluded
 * @returns generated output file name
 */
export function getMetadataFile(
  analysisType: keyof typeof AnalysisTypes,
  defaultData?: Metadata,
  exclusions?: Array<string>,
): string {
  defaults = defaultData;
  excludedFields = exclusions;
  const data = generateMetadata(analysisType);
  const fileName = generateSampleName(analysisType);
  fs.writeFileSync(`/tmp/${fileName}.csv`, objToCsv(data));
  return fileName;
}

/**
 * Helper function that generates the metadata
 * @param analysisType, required - should be one of the three analysis types
 * @returns metadata object
 */
export function generateMetadata(
  analysisType: keyof typeof AnalysisTypes,
): Metadata {
  let data: Metadata = {
    "Sample Name": generateSampleName(analysisType),
    "Host Organism": getAttributeValue("Host Organism"),
    "Sample Type": getAttributeValue("Sample Type"),
    "Nucleotide Type": getAttributeValue("Nucleotide Type"),
    "Collection Date": getYearMonthInThePast(),
    "Water Control": sample(yesOrNo),
    "Collection Location": faker.faker.address.city(),
  };
  return setOptionalMetadataAtrribute(data);
}

/**
 * Helper function to generate sample name; helps avoid duplicate names
 * @param analysisType required - should be one of the three analysis types
 * @returns sample name string
 */
export function generateSampleName(
  analysisType: keyof typeof AnalysisTypes,
): string {
  const minNumber = 10000;
  const maxNumber = 99999;
  return `${analysisType.replace(" ", "-")}-${getRandomNumber(
    minNumber,
    maxNumber,
  )}`;
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
  const selectStringFields = optionalFieldFixture["selectStringFields"];
  const alphaNumericFields = optionalFieldFixture["alphaNumericFields"];

  let value: any;
  if (selectStringFields.includes(attribute)) {
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
