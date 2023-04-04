import React from "react";
import { getSearchSuggestions } from "~/api";
import { AsyncMultipleDropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

interface TaxonFilterProps {
  domain: string;
  selectedOptions: { id: number; level: string; name: string }[];
  onChange: (selected: string) => void;
  disabled: boolean;
}

const TaxonFilter = ({
  domain,
  selectedOptions,
  onChange,
  disabled,
}: TaxonFilterProps) => {
  const handleFilterChange = async (query: string) => {
    const searchResults = await getSearchSuggestions({
      query,
      categories: ["taxon"],
      domain,
    });
    return (((searchResults || {}).Taxon || {}).results || [])
      .filter(result => result.taxid > 0)
      .map(result => ({
        value: result.taxid,
        text: result.title,
      }));
  };

  return (
    <AsyncMultipleDropdown
      // @ts-expect-error Property 'arrowInsideTrigger' does not exist on type
      arrowInsideTrigger={false}
      trigger={<div className={cs.filterLabel}>Taxon</div>}
      menuLabel="Select Taxon"
      selectedOptions={selectedOptions}
      onFilterChange={handleFilterChange}
      onChange={onChange}
      disabled={disabled}
    />
  );
};

export default TaxonFilter;
