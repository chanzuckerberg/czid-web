import { isObject, keyBy, mapValues } from "lodash/fp";
import { FIELDS_THAT_HAVE_MAX_INPUT } from "~/components/common/Metadata/constants";
import {
  LocationObject,
  Metadata,
  MetadataType,
  MetadataTypes,
  RawMetadata,
} from "~/interface/shared";

// Transform the server metadata response to a simple key => value map.
export const processMetadata = ({
  metadata,
  flatten = false,
}: {
  metadata?: RawMetadata[] | null;
  flatten: boolean;
}): Metadata => {
  if (!metadata) {
    return {};
  }
  const metadataObject = keyBy("key", metadata);
  const newMetadata = mapValues(
    (val: RawMetadata) =>
      val.base_type === "date"
        ? val.raw_value
        : val[`${val.base_type}_validated_value`],
    metadataObject,
  );
  // If flatten, simplify objects (e.g. location objects) to .name
  if (flatten) {
    return mapValues(val => (isObject(val) ? val.name : val), newMetadata);
  }

  return newMetadata;
};

export const processMetadataTypes = (
  metadataTypes: MetadataType[] | null | undefined,
): MetadataTypes => {
  if (!metadataTypes) {
    return {};
  }
  return keyBy("key", metadataTypes);
};

export const returnHipaaCompliantMetadata = (
  metadataType: string,
  metadataValue: string,
) => {
  let hipaaCompliantValue = metadataValue;
  if (metadataType === "host_age") {
    const parsedAge = Number.parseInt(metadataValue);
    const maxAge = FIELDS_THAT_HAVE_MAX_INPUT[metadataType];
    if (parsedAge >= maxAge) {
      hipaaCompliantValue = "≥ " + maxAge;
    }
  }
  return hipaaCompliantValue;
};

export const formatSendValue = (value: string | LocationObject | number) => {
  if (isObject(value)) {
    return {
      query_SampleMetadata_metadata_items_location_validated_value_oneOf_1_Input:
        value,
    };
  } else {
    return {
      String: String(value),
    };
  }
};
