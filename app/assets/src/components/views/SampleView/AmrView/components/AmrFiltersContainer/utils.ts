import { size } from "lodash/fp";
import { AmrFilterSelections } from "~/interface/sampleView";

export const countActiveFilters = (filters: AmrFilterSelections): number => {
  if (!filters) return 0;

  // When more filters are added, this function will need to be updated (e.g. AMR category filter is coming in the future)
  return Object.values(filters).reduce((result, filters) => {
    return result + size(filters);
  }, 0);
};
