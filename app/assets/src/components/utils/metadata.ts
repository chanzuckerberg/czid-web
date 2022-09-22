import { keyBy, mapValues, isObject } from "lodash/fp";
import { FIELDS_THAT_HAVE_MAX_INPUT } from "~/components/common/Metadata/constants";
import { Metadata, RawMetadata } from "~/interface/shared";
import { MetadataType } from "../common/DetailsSidebar/SampleDetailsMode/MetadataTab";

// Transform the server metadata response to a simple key => value map.
export const processMetadata = ({
  metadata,
  flatten = false,
}: {
  metadata: RawMetadata[];
  flatten: boolean;
}): Metadata => {
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
    const flatNewMetadata = mapValues(
      val => (isObject(val) ? val.name : val),
      newMetadata,
    );
    return flatNewMetadata;
  }
  return newMetadata;
};

export const processMetadataTypes = (metadataTypes: {
  [key: string]: MetadataType;
}) => keyBy("key", metadataTypes);

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
