import React from "react";

import { getGeoSearchSuggestions } from "~/api/locations";
import LiveSearchBox from "~ui/controls/LiveSearchBox";
import PropTypes from "prop-types";

// An input box that fetches and shows geosearch suggestions for user input of locations.
class GeoSearchInputBox extends React.Component {
  // Fetch geosearch results and format into categories for LiveSearchBox
  handleSearchTriggered = async query => {
    const serverSideSuggestions = await getGeoSearchSuggestions(query);
    // Semantic UI Search expects results as: `{ category: { name: '', results: [{ title: '', description: '' }] }`
    let categories = {};
    if (serverSideSuggestions.length > 0) {
      const locationsCategory = "Location Results";
      categories[locationsCategory] = {
        name: locationsCategory,
        // LiveSearchBox/Search tries to use 'title' as 'key'. Use title + i instead.
        results: serverSideSuggestions.map((r, i) =>
          Object.assign({}, r, { key: `${r.title}-${i}` })
        )
      };
    }
    // Let users select an unresolved plain text option
    let noMatchName = "Plain Text (No Location Match)";
    categories[noMatchName] = {
      name: noMatchName,
      results: [{ title: query }]
    };
    return categories;
  };

  render() {
    const { onResultSelect } = this.props;
    return (
      <LiveSearchBox
        onSearchTriggered={this.handleSearchTriggered}
        onResultSelect={onResultSelect}
        placeholder="Enter a location"
        rectangular
        inputMode
      />
    );
  }
}

GeoSearchInputBox.propTypes = {
  onResultSelect: PropTypes.func
};

export default GeoSearchInputBox;
