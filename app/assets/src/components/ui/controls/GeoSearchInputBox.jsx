import React from "react";
import PropTypes from "prop-types";
import { isString } from "lodash/fp";

import { logAnalyticsEvent } from "~/api/analytics";
import { getGeoSearchSuggestions } from "~/api/locations";
import LiveSearchBox from "~ui/controls/LiveSearchBox";

// An input box that fetches and shows geosearch suggestions for user input of locations.
class GeoSearchInputBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: "",
      usePropValue: true
    };
  }

  // Fetch geosearch results and format into categories for LiveSearchBox
  handleSearchTriggered = async query => {
    const serverSideSuggestions = await getGeoSearchSuggestions(query);
    // Semantic UI Search expects results as: `{ category: { name: '', results: [{ title: '', description: '' }] }`
    let categories = {};
    if (serverSideSuggestions.length > 0) {
      const locationsCategory = "Location Results";
      categories[locationsCategory] = {
        name: locationsCategory,
        // Format title/description for the text box.
        results: serverSideSuggestions.map(r => {
          const nameParts = r.name.split(", ");
          r.title = nameParts[0];
          r.description = nameParts.slice(1).join(", ");
          r.key = `loc-${r.locationiq_id}`;
          return r;
        })
      };
    }
    // Let users select an unresolved plain text option
    let noMatchName = "Plain Text (No Location Match)";
    categories[noMatchName] = {
      name: noMatchName,
      results: [{ title: query }]
    };

    logAnalyticsEvent("GeoSearchInputBox_location_queried", {
      query: query,
      numResults: serverSideSuggestions.length
    });
    return categories;
  };

  handleSearchChange = value => {
    // Let the inner search box change on edit
    this.setState({ value, usePropValue: false });
  };

  handleResultSelected = ({ result }) => {
    const { onResultSelect } = this.props;
    this.setState({ usePropValue: true });

    // Wrap plain text submission
    if (isString(result)) result = { title: result };

    logAnalyticsEvent("GeoSearchInputBox_result_selected", {
      selected: result.title,
      // Real results will have a description
      isMatched: !!result.description
    });
    onResultSelect && onResultSelect({ result });
  };

  render() {
    const { value: locationData } = this.props;
    const { usePropValue, value } = this.state;

    return (
      <LiveSearchBox
        onSearchTriggered={this.handleSearchTriggered}
        onSearchChange={this.handleSearchChange}
        onResultSelect={this.handleResultSelected}
        placeholder="Enter a location"
        value={usePropValue && locationData ? locationData.name : value}
        initialValue={null}
        rectangular
        inputMode
      />
    );
  }
}

GeoSearchInputBox.propTypes = {
  onResultSelect: PropTypes.func,
  value: PropTypes.object
};

export default GeoSearchInputBox;
