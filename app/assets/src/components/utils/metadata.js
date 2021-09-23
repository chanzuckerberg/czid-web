import { keyBy, mapValues, isObject } from "lodash/fp";
import { FIELDS_THAT_HAVE_MAX_INPUT } from "~/components/common/Metadata/constants";

// Transform the server metadata response to a simple key => value map.
export const processMetadata = ({ metadata, flatten = false }) => {
  let newMetadata = keyBy("key", metadata);

  newMetadata = mapValues(
    val =>
      val.base_type === "date"
        ? val.raw_value
        : val[`${val.base_type}_validated_value`],
    newMetadata
  );
  // If flatten, simplify objects (e.g. location objects) to .name
  if (flatten) {
    newMetadata = mapValues(
      val => (isObject(val) ? val.name : val),
      newMetadata
    );
  }
  return newMetadata;
};

export const processMetadataTypes = metadataTypes =>
  keyBy("key", metadataTypes);

export const returnHipaaCompliantMetadata = (metadataType, metadataValue) => {
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
