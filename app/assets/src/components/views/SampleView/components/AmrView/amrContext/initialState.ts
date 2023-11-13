import { DATA_FILTER_INIT } from "../components/AmrFiltersContainer/AmrFiltersContainer";
import { FiltersType } from "../components/AmrFiltersContainer/types";

export interface AmrContextStateType {
  reportTableDownloadWithAppliedFiltersLink: string | null;
  activeFilters: FiltersType | null;
  drugClasses: string[] | null;
}

export const initialAmrContext: AmrContextStateType = {
  reportTableDownloadWithAppliedFiltersLink: null,
  activeFilters: DATA_FILTER_INIT,
  drugClasses: null,
};
