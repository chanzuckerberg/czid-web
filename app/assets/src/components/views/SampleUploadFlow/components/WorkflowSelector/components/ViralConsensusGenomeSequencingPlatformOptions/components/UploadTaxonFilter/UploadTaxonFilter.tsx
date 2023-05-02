import { Dropdown, DropdownPopper, LoadingIndicator } from "czifui";
import { debounce, get, unionBy } from "lodash/fp";
import React, { useEffect, useMemo, useState } from "react";
import { getSearchSuggestions } from "~/api";
import {
  TaxonOption,
  TaxonSearchResult,
} from "~/components/common/filters/types";
import cs from "./upload_taxon_filter.scss";

const AUTOCOMPLETE_DEBOUNCE_DELAY = 600;
const NO_SEARCH_RESULTS_TEXT = "No results";
const MIN_SEARCH_LENGTH = 2;

interface UploadTaxonFilterProps {
  selectedTaxon: TaxonOption;
  onChange: (taxonOption: TaxonOption) => void;
  disabled?: boolean;
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

const UNKNOWN_TAXON = {
  id: null,
  name: "Unknown",
};

const UploadTaxonFilter = ({
  selectedTaxon,
  onChange,
}: UploadTaxonFilterProps) => {
  const [options, setOptions] = useState<TaxonOption[]>();
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [noOptionsText, setNoOptionsText] = useState("");

  useEffect(() => {
    // ensure the "unknown" taxon option is always available
    if (!options) {
      setOptions([UNKNOWN_TAXON]);
    } else if (!options.includes(UNKNOWN_TAXON)) {
      setOptions([...options, UNKNOWN_TAXON]);
    }
  }, [options]);

  useEffect(() => {
    // Stop the invocation of the debounced function after unmounting this component
    return () => {
      loadOptionsForQuery.cancel();
    };
  }, []);

  const getTaxaOptionsForQuery = async (query: string) => {
    const searchResults = await getSearchSuggestions({
      query,
      categories: ["virus"],
      domain: "upload",
    });

    // elasticsearch returns an empty object if there are no results
    const taxonResults: TaxonSearchResult[] = get(
      "Taxon.results",
      searchResults,
    );

    return taxonResults
      ? taxonResults
          .filter((result: TaxonSearchResult) => result.taxid > 0)
          .map((result: TaxonSearchResult) => ({
            id: result.taxid,
            name: result.title,
            level: result.level,
          }))
      : [];
  };

  const loadOptionsForQuery = useMemo(
    () =>
      debounce(AUTOCOMPLETE_DEBOUNCE_DELAY, async (query: string) => {
        let noOptionsText = "";
        let newOptions = [];

        // Empty queries return no results from ES, and single character queries
        // are inefficient and not very helpful, so don't run a query in those cases
        if (query?.length >= MIN_SEARCH_LENGTH) {
          noOptionsText = NO_SEARCH_RESULTS_TEXT;
          newOptions = await getTaxaOptionsForQuery(query);
        }

        setOptions(unionBy("id", newOptions, [selectedTaxon]));
        setNoOptionsText(noOptionsText);
        setOptionsLoading(false);

        return newOptions;
      }),
    [selectedTaxon],
  );

  const onInputChange = (event: React.SyntheticEvent, value: string) => {
    const isSearchInputChange = event?.type === "change";

    // This may be fixed at some point in SDS, but selecting an option
    // in the dropdown triggers an input change, but we do not want to
    // perform a new search
    if (!isSearchInputChange) return;

    // Show loading indicator
    // options have to be empty for loading indicator to show in Dropdown
    setOptions([]);
    setOptionsLoading(true);

    // Show UI display for short searches as soon as possible, but call
    // debounced handler to avoid race condition where results from
    // long running search results replace an empty search
    if (value?.length < MIN_SEARCH_LENGTH) {
      setNoOptionsText("");
      setOptions([selectedTaxon]);
      setOptionsLoading(false);
    }

    loadOptionsForQuery(value);
  };

  const label = selectedTaxon?.name ?? "Select Taxon Name";

  return (
    <Dropdown
      className={cs.dropdown}
      InputDropdownProps={{
        label,
        intent: "default",
        sdsStyle: "square",
        sdsType: "singleSelect",
      }}
      isTriggerChangeOnOptionClick
      search
      label={label}
      options={options}
      onChange={onChange}
      value={selectedTaxon}
      DropdownMenuProps={{
        keepSearchOnSelect: true,
        loading: optionsLoading,
        loadingText: <LoadingIndicator sdsStyle="minimal" />,
        noOptionsText: noOptionsText,
        onInputChange,
        isOptionEqualToValue: (option: TaxonOption, value: TaxonOption) =>
          option.id === value.id,
      }}
      PopperComponent={StyledDropdownPopper}
    />
  );
};

export { UploadTaxonFilter };
