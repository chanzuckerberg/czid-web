import PropTypes from "prop-types";
import React from "react";
import { getSearchSuggestions } from "~/api";
import { AsyncMultipleDropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

const TaxonFilter = ({ domain, selectedOptions, onChange, disabled }) => {
  const handleFilterChange = async query => {
    const searchResults = await getSearchSuggestions({
      query,
      categories: ["taxon"],
      domain,
    });
    const options = (((searchResults || {}).Taxon || {}).results || [])
      .filter(result => result.taxid > 0)
      .map(result => ({
        value: result.taxid,
        text: result.title,
      }));
    return options;
  };

  return (
    <AsyncMultipleDropdown
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

TaxonFilter.propTypes = {
  domain: PropTypes.string,
  selectedOptions: PropTypes.array,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default TaxonFilter;
