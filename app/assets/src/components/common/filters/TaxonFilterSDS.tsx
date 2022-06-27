import { AutocompleteInputChangeReason } from "@material-ui/lab/Autocomplete";
import { Dropdown, DropdownPopper } from "czifui";
import { get, unionBy, debounce, size } from "lodash/fp";
import React, { useState } from "react";
import { getSearchSuggestions } from "~/api";

import cs from "./taxon_filter_sds.scss";
const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;

export interface TaxonOption {
  id: number;
  name: string;
}

interface TaxonFilterSDSProps {
  domain: string;
  selectedTaxa: TaxonOption[];
  handleChange: (selected: TaxonOption[]) => void;
  disabled?: boolean;
}

interface TaxonSearchResult {
  taxid: number;
  title: string;
  category: string;
  description: string;
  level: string;
}

const StyledDropdownPopper = (props: any) => {
  return (
    <DropdownPopper
      className={cs.dropdownPopper}
      placement="bottom-start"
      {...props}
    />
  );
};

const TaxonFilterSDS = ({
  domain,
  selectedTaxa = [],
  handleChange,
}: TaxonFilterSDSProps) => {
  const [options, setOptions] = useState<TaxonOption[] | []>(selectedTaxa);

  const numTaxaSelected = size(selectedTaxa);
  const label =
    numTaxaSelected > 0 ? `${numTaxaSelected} Taxa Selected` : "Choose Taxon";

  const handleFilterChange = async (query: string) => {
    const searchResults = await getSearchSuggestions({
      query,
      categories: ["taxon"],
      domain,
    });

    const options: TaxonSearchResult[] = get("Taxon.results", searchResults)
      .filter((result: TaxonSearchResult) => result.taxid > 0)
      .map((result: TaxonSearchResult) => ({
        id: result.taxid,
        name: result.title,
        level: result.level,
      }));

    return options;
  };

  const loadOptionsForQuery = debounce(
    AUTOCOMPLETE_DEBOUNCE_DELAY,
    async (query: string) => {
      const newOptions = await handleFilterChange(query);
      setOptions(unionBy("id", newOptions, selectedTaxa));
    },
  );

  const onInputChange = (
    _event: React.SyntheticEvent,
    value: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _reason: AutocompleteInputChangeReason,
  ) => {
    if (value) {
      loadOptionsForQuery(value);
    }
  };

  return (
    <Dropdown
      className={cs.dropdown}
      InputDropdownProps={{
        label,
        intent: "default",
        sdsStyle: "square",
        sdsType: "multiSelect",
      }}
      label={label}
      multiple
      isTriggerChangeOnOptionClick
      search
      options={options}
      onChange={handleChange}
      value={selectedTaxa}
      MenuSelectProps={{
        noOptionsText: "No results",
        onInputChange,
        getOptionSelected: (option: TaxonOption, value: TaxonOption) =>
          option.id === value.id,
      }}
      PopperComponent={StyledDropdownPopper}
    />
  );
};

export default TaxonFilterSDS;
