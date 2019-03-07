import React from "react";
import PropTypes from "prop-types";
import { AsyncMultipleDropdown } from "~ui/controls/dropdowns";
import { getSearchSuggestions } from "~/api";
import cs from "./filters.scss";

class TaxonFilter extends React.Component {
  handleFilterChange = async query => {
    const searchResults = await getSearchSuggestions({
      query: query,
      categories: ["taxon"]
    });
    const options = (((searchResults || {}).Taxon || {}).results || [])
      .filter(result => result.taxid > 0)
      .map(result => ({
        value: result.taxid,
        text: result.title
      }));
    return options;
  };

  render() {
    const { onChange, selectedOptions } = this.props;

    return (
      <AsyncMultipleDropdown
        arrowInsideTrigger={false}
        trigger={<div className={cs.filterLabel}>Taxon</div>}
        menuLabel="Select Taxon"
        selectedOptions={selectedOptions}
        onFilterChange={this.handleFilterChange}
        onChange={onChange}
      />
    );
  }
}

TaxonFilter.propTypes = {
  selectedOptions: PropTypes.array,
  onChange: PropTypes.func
};

export default TaxonFilter;
