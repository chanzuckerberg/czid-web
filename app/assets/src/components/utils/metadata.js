import { keyBy, mapValues, pickBy } from "lodash/fp";

// Transform the server metadata response to a simple key => value map.
export const processMetadata = metadata => {
  let newMetadata = keyBy("key", metadata);

  newMetadata = mapValues(
    val =>
      val.base_type === "date"
        ? val.raw_value
        : val[`${val.base_type}_validated_value`],
    newMetadata
  );
  return newMetadata;
};

export const processMetadataTypes = metadataTypes =>
  keyBy("key", metadataTypes);

export const filterLocation = location => {
  // Remove locations that don't have any a-z characters (e.g. coordinates)
  if (location && location.match(/[a-z]/i)) {
    return location;
  } else {
    return null;
  }
};

export const filterLocationDimension = dimensions => {
  const group = pickBy(d => d.dimension === "location", dimensions);
  const i = Object.keys(group)[0];
  const locations = group[0].values;
  dimensions[i].values = locations.filter(p => p.value.match(/[a-z]/i));
  console.log(dimensions);
  console.log("filtered: ", dimensions);
  return dimensions;
};
