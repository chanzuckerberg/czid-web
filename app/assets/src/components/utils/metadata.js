import { keyBy, mapValues, isObject } from "lodash/fp";

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
