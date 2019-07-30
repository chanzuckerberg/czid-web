import React from "react";
import PropTypes from "prop-types";
import { isString } from "lodash/fp";

import { logAnalyticsEvent } from "~/api/analytics";
import { getGeoSearchSuggestions } from "~/api/locations";
import LiveSearchPopBox from "~ui/controls/LiveSearchPopBox";

// An input box that fetches and shows geosearch suggestions for user input of locations.
class GeoSearchInputBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.value !== state.prevPropsValue) {
      return {
        value: props.value,
        prevPropsValue: props.value,
      };
    }
    return null;
  }

  // Fetch geosearch results and format into categories for LiveSearchBox
  handleSearchTriggered = async query => {
    let categories = {};
    try {
      const serverSideSuggestions = await getGeoSearchSuggestions(query);
      // Semantic UI Search expects results as: `{ category: { name: '', results: [{ title: '', description: '' }] }`
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
          }),
        };
      }
      logAnalyticsEvent("GeoSearchInputBox_location_queried", {
        query: query,
        numResults: serverSideSuggestions.length,
      });
    } catch (e) {
      // In the case of an error (e.g. no API key in dev), just catch and show the plain text option.
      // eslint-disable-next-line no-console
      console.log(e);
      logAnalyticsEvent("GeoSearchInputBox_request_erred", {
        query,
        message: e.message,
      });
    }

    // Let users select an unresolved plain text option
    let noMatchName = "Plain Text (No Location Match)";
    categories[noMatchName] = {
      name: noMatchName,
      results: [{ title: query, name: query }],
    };
    return categories;
  };

  handleSearchChange = value => {
    // Let the inner search box change on edit
    this.setState({ value }, () => {
      // Handle the case when they clear the box and hit done/submit without pressing enter
      if (value === "") this.handleResultSelected({ result: value });
    });
  };

  handleResultSelected = ({ result }) => {
    const { onResultSelect } = this.props;

    console.log("dropdown result looks like: ", result);

    // Wrap plain text submission
    if (isString(result) && result !== "") result = { name: result };

    this.setState({ value: result });

    logAnalyticsEvent("GeoSearchInputBox_result_selected", {
      selected: result.name,
      // Real results will have a description
      isMatched: !!result.description,
    });

    onResultSelect && onResultSelect({ result });
  };

  render() {
    const { className } = this.props;
    const { value } = this.state;

    return (
      <LiveSearchPopBox
        className={className}
        inputMode
        onSearchTriggered={this.handleSearchTriggered}
        onSearchChange={this.handleSearchChange}
        onResultSelect={this.handleResultSelected}
        placeholder="Enter a location"
        value={isString(value) ? value : value.name}
        rectangular
      />
    );
  }
}

GeoSearchInputBox.defaultProps = {
  value: "",
};

GeoSearchInputBox.propTypes = {
  className: PropTypes.string,
  onResultSelect: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

export default GeoSearchInputBox;
