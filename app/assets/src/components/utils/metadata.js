import { keyBy, mapValues } from "lodash";

// Transform the server metadata response to a simple key => value map.
export const processMetadata = metadata => {
  let newMetadata = keyBy(metadata, "key");

  newMetadata = mapValues(
    newMetadata,
    val =>
      val.data_type === "string"
        ? val.text_validated_value
        : val.number_validated_value
  );

  return newMetadata;
};

export const processMetadataTypes = metadataTypes =>
  keyBy(metadataTypes, "key");
