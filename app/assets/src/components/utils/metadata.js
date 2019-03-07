import { keyBy, mapValues } from "lodash/fp";

// Transform the server metadata response to a simple key => value map.
export const processMetadata = metadata => {
  let newMetadata = keyBy("key", metadata);

  newMetadata = mapValues(
    val => val[`${val.base_type}_validated_value`],
    newMetadata
  );
  return newMetadata;
};

export const processMetadataTypes = metadataTypes =>
  keyBy("key", metadataTypes);
