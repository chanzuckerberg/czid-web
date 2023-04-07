import {
  chunk,
  filter,
  isNaN,
  isNull,
  isUndefined,
  map,
  max,
  min,
  random,
  uniq,
  zip,
} from "lodash/fp";
import { getGeoSearchSuggestions } from "~/api/locations";
import { processLocationSelection } from "~/components/ui/controls/GeoSearchInputBox";
import { CSV, MetadataValue } from "~/interface/shared";
import {
  CONCURRENT_REQUESTS_LIMIT,
  FIELDS_THAT_HAVE_MAX_INPUT,
  FIELDS_THAT_SHOULD_NOT_HAVE_NEGATIVE_INPUT,
  REQUEST_DELAY_MAX,
  REQUEST_DELAY_MIN,
} from "./constants";
import {
  MetadataCSVLocationsMenuProps,
  MetadataInputProps,
  MetadataPreLocationSearch,
  MetadataTable,
  Row,
} from "./types";

// Batch geosearch CSV locations for matches
export const geosearchCSVLocations = async (
  metadata: MetadataPreLocationSearch,
  locationMetadataType: MetadataCSVLocationsMenuProps["locationMetadataType"],
): Promise<MetadataTable> => {
  if (!(metadata && metadata.rows)) return;

  // For each unique plain text value, get the #1 search result, if any.
  const rawNames = uniq(metadata.rows.map(r => r[locationMetadataType.name]));
  const matchedLocations = {};
  const requests = rawNames.map(async query => {
    const res = await getGeoSearchSuggestions(query, 1);
    if (res.length > 0) matchedLocations[query] = res[0];
  });

  // Batch the requests with a delay to avoid geosearch API limits.
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const batches = chunk(CONCURRENT_REQUESTS_LIMIT, requests);
  const batchRequests = batches.map(async (batch, batchIndex) => {
    await Promise.all(batch);
    // Sleep after every batch except the last
    if (batchIndex !== batches.length - 1) {
      await sleep(random(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX));
    }
  });
  await Promise.all(batchRequests);

  // Process results and set warnings.
  const newMetadata: MetadataTable = metadata;
  metadata.rows.forEach((row, rowIndex) => {
    const locationName = row[locationMetadataType.name];

    const result = processLocationSelection(
      (typeof locationName === "string" && matchedLocations[locationName]) ||
        locationName,
      isRowHuman(row),
    );
    if (typeof locationName === "string" && locationName in matchedLocations) {
      newMetadata.rows[rowIndex][locationMetadataType.name] = result;
    }
  });
  return newMetadata;
};

export const isRowHuman = (row: Row) =>
  (row["Host Organism"] && row["Host Organism"].toLowerCase() === "human") ||
  (row["Host Genome"] && row["Host Genome"].toLowerCase() === "human");

export const processCSVMetadata = (csv: CSV): MetadataPreLocationSearch => {
  const { headers, rows } = csv;
  return {
    headers,
    // Remove empty values, and convert rows from array of strings to object.
    rows: map(
      // It's possible to have two different MetadataFields with the same name, but for different host genomes.
      // In this case, only one of the two fields will have a value for any given sample
      // (since only one of them will the sample's host genome).
      // There is a risk if you naively zipObject that you will overwrite the actual value with an empty value
      // (from the other metadata field with the same name), since precedence is based on the order.
      // The below code makes sure this case is handled correctly by filtering before converting to an object.
      row =>
        Object.fromEntries(
          filter((pair: string[]) => pair[1] !== "", zip(headers, row)),
        ),
      rows,
    ),
  };
};

// If value is undefined or null, an empty string should be displayed.
// However, if the MetadataInput is re-used for different samples, and the second sample has no value
// a particular metadata field, undefined will be passed to the MetadataInput for that field
// and the first sample's metadata value will contain to be shown.
// To avoid this, we explicitly pass in the empty string whenever the field is undefined or null.
export const ensureDefinedValue = ({
  key = "",
  value,
  type,
  taxaCategory,
}: {
  key: string;
  value: MetadataValue | undefined | null;
  type: MetadataInputProps["metadataType"]["dataType"];
  taxaCategory: string;
}): MetadataValue => {
  let safeValue = isUndefined(value) || isNull(value) ? "" : value;

  if (
    FIELDS_THAT_SHOULD_NOT_HAVE_NEGATIVE_INPUT.has(key) &&
    type === "number" &&
    safeValue
  ) {
    const parsedValue =
      typeof value === "string" ? Number.parseInt(value) : value;
    if (!isNaN(parsedValue)) {
      // Do not let the user select values less than 0
      safeValue = max([parsedValue, 0]);
    }

    // Numbers that exceed maxValue will be stored as maxValue + 1
    if (key in FIELDS_THAT_HAVE_MAX_INPUT && taxaCategory === "human") {
      const maxValue = FIELDS_THAT_HAVE_MAX_INPUT[key];
      safeValue = min([safeValue, maxValue + 1]);
    }
  }
  return safeValue;
};
