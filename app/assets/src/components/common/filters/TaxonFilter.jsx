import PropTypes from "prop-types";
import React from "react";
import { getSearchSuggestions } from "~/api";
import { AsyncMultipleDropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

class TaxonFilter extends React.Component {
  handleFilterChange = async query => {
    const { domain } = this.props;

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

  render() {
    const { onChange, selectedOptions, disabled } = this.props;

    return (
      <AsyncMultipleDropdown
        arrowInsideTrigger={false}
        trigger={<div className={cs.filterLabel}>Taxon</div>}
        menuLabel="Select Taxon"
        selectedOptions={selectedOptions}
        onFilterChange={this.handleFilterChange}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
}

TaxonFilter.propTypes = {
  domain: PropTypes.string,
  selectedOptions: PropTypes.array,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default TaxonFilter;
