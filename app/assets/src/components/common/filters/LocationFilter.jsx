import React from "react";
import PropTypes from "prop-types";
import { AsyncMultipleDropdown } from "~ui/controls/dropdowns";
import { getSearchSuggestions } from "~/api";
import cs from "./filters.scss";

class LocationFilter extends React.Component {
  handleFilterChange = async query => {
    const searchResults = await getSearchSuggestions({
      query: query,
      categories: ["location"]
    });
    const options = (((searchResults || {}).Location || {}).results || []).map(
      result => ({
        value: result.id,
        text: result.title
      })
    );
    return options;
  };

  render() {
    const { onChange, selectedOptions } = this.props;

    return (
      <AsyncMultipleDropdown
        arrowInsideTrigger={false}
        trigger={<div className={cs.filterLabel}>Location</div>}
        menuLabel="Select Location"
        selectedOptions={selectedOptions}
        onFilterChange={this.handleFilterChange}
        onChange={onChange}
      />
    );
  }
}

LocationFilter.propTypes = {
  selectedOptions: PropTypes.array,
  onChange: PropTypes.func,
  counters: PropTypes.object
};

export default LocationFilter;
