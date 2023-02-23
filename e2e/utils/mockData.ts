import fs from "fs";
import { sample } from "lodash/fp";
import { AnalysisTypes } from "../types/analysisTypes";
import { Filter } from "../types/filter";
import { Metadata } from "../types/metadata";
import { SampleLocation } from "../types/sampleLocation";
import { Workflow } from "../types/workflow";
import {
  getAlphaNumericString,
  getAttributeOrDefault,
  getFixture,
  getRandomNumber,
  getYearMonthInThePast,
} from "./common";

const yesOrNo = ["Yes", "No"];
const statuses = ["COMPLETE", "FAILED"];
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
  const data: Metadata = {
    "Sample Name": sampleName,
    "Host Organism": getAttributeValue("Host Organism"),
    "Sample Type": getAttributeValue("Sample Type"),
    "Nucleotide Type": getAttributeValue("Nucleotide Type"),
    "Collection Date": getYearMonthInThePast(),
    "Water Control": sample(yesOrNo),
    "Collection Location": "New York",
  };
  return setOptionalMetadataAttribute(data);
}

/**
 * Helper function that sets the values for all optional fields
 * Fields listed in 'excludedFields' constant will not be included
 * @param data - sample data object, should have required fields defined at this stage but can be added after
 * @returns Metadata object
 */
export function setOptionalMetadataAttribute(data: Metadata): Metadata {
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

/**
 *
 * @param workflowName Function generated workflow data for stubbing the response
 * for workflow API call
 * @param projectId project ID for samples in the wrokflow
 * @param sampleName name of the sample
 * @returns Workflow object that will be passed to the mock service
 */
export function generateWorkflowData(
  workflowName: string,
  projectId: number,
  sampleName: string,
  filter: Filter,
): Workflow {
  const workflow = getFixture("workflows");
  workflow.id = getRandomNumber(1000, 9999);
  workflow.workflow = workflowName;
  workflow.created_at = filter.created_at;
  workflow.status = sample(statuses) as string;
  workflow.cached_results.taxon_info.taxon_name = filter.taxon_name;
  workflow.inputs.taxon_name = filter.taxon_name;
  workflow.sample.info.name = sampleName;
  workflow.sample.info.public = filter.public;
  workflow.sample.info.project_id = projectId;
  workflow.sample.info.host_genome_name = filter.host;
  workflow.sample.metadata.sample_type = filter.sample_type;
  workflow.sample.metadata.collection_date = filter.collection_date;
  workflow.sample.metadata.collection_location_v2.name =
    filter.collection_location_v2;

  return workflow;
}

export function generateLocation(defaults: SampleLocation): SampleLocation {
  return {
    id: defaults.id,
    name: defaults.name,
    geo_level: "state",
    country_name: defaults.country_name,
    state_name: defaults.state_name,
    subdivision_name: "",
    city_name: "",
    lat: "36.7",
    lng: "-118.76",
    country_id: defaults.country_id,
    state_id: defaults.state_id,
    subdivision_id: undefined,
    city_id: undefined,
    sample_ids: defaults.sample_ids,
    project_ids: defaults.project_ids,
  };
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
