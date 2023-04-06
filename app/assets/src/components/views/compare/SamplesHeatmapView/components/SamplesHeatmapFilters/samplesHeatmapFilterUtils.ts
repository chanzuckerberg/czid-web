import {
  SDSFormattedOption,
  TextValueNumber,
  TextValueString,
} from "./SamplesHeatmapFilters";

// To figure out current state and render the details tag line, we need to be able to translate from the option `value` to its `name`
export const valueToName = (
  value: number | string,
  options: Array<SDSFormattedOption>,
): string => {
  if (options.length === 0) {
    return "";
  }
  if (value === null || value === undefined) {
    return "";
  }
  const matchingNames = options.filter(option => option.value === value);
  if (matchingNames.length === 1) {
    // 1:1 value:name mapping, as expected
    return matchingNames[0].text;
  } else if (matchingNames.length > 1) {
    // error condition: multiple names for the same value
    console.error(
      `Heatmap filter state bug: multiple options found for value ${value}!`,
      options,
    );
    return matchingNames[0].text;
  } else {
    // error condition: no names for the given value
    console.error(
      `Heatmap filter state bug: no options found for value ${value}`,
      options,
    );
    return value.toString();
  }
};

// SDS dropdowns rely heavily on the 'name' attribute, so copy it over from our existing 'text' attribute
export const valueToSDSFormatOption = (
  value: number | string,
  options: Array<SDSFormattedOption>,
): { text: string; name: string; value: string | number } => {
  const name = valueToName(value, options);
  return {
    text: name,
    name,
    value,
  };
};

// Convert from our options format to the format used by the dropdowns (i.e., add a 'name' field)
export const optionsToSDSFormat = (
  options: Array<TextValueNumber | TextValueString>,
): Array<SDSFormattedOption> => {
  return options.map(option => {
    const text = option.text || "";

    return {
      ...option,
      text,
      name: text,
    };
  });
};
