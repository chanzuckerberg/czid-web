import { NO_CONTENT_FALLBACK } from "~/components/ui/Table/constants";

// some of the numerical values in the table come in already cast as strings
const canValueBeNumber = (value: string) => !isNaN(Number(value));

// return true if the value is a non-empty string that is not numerical
export const shouldShowTooltip = value => {
  return !canValueBeNumber(value) && value !== NO_CONTENT_FALLBACK;
};

// We get a lot of different kinds of values from the API, all of which need to
// end up as strings in the table. This function handles all the different cases.
export const getFormattedValueAsString = (
  rawValue: string | number | null | undefined,
) => {
  if (!rawValue) {
    // return placeholder string if value is false-y
    return NO_CONTENT_FALLBACK;
  } else if (typeof rawValue === "string" && !canValueBeNumber(rawValue)) {
    // if the value is a string which is not numerical, check for
    // compound strings separated by semicolons and sort them alphabetically.
    // returns the original string if it is not compound
    const valueParts = rawValue.split(";").map(value => value.trim());
    valueParts.sort();
    return valueParts.filter(value => value.length > 0).join("; ");
  } else {
    // cast numbers as strings
    return String(rawValue);
  }
};
