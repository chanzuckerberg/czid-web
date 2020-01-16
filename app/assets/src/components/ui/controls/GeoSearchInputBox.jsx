import React from "react";
import PropTypes from "prop-types";
import { compact, get, isString } from "lodash/fp";

import { logAnalyticsEvent } from "~/api/analytics";
import { getGeoSearchSuggestions } from "~/api/locations";
import LiveSearchPopBox from "~ui/controls/LiveSearchPopBox";

export const LOCATION_PRIVACY_WARNING =
  "Changed to county/district level for personal privacy.";
export const LOCATION_UNRESOLVED_WARNING =
  // this is the max length to appear on one line
  "No match. Sample will not appear on maps.";

// Process location selections and add warnings.
export const processLocationSelection = (result, isHuman) => {
  let warning = "";
  if (isHuman && get("geo_level", result) === "city") {
    result = Object.assign({}, result); // make a copy to avoid side effects
    // For human samples, drop the city part of the name and show a warning.
    // NOTE: The backend will redo the geosearch for confirmation and re-apply
    // this restriction.
    result.name = compact([
      result.subdivision_name,
      result.state_name,
      result.country_name,
    ]).join(", ");

    if (result.subdivision_name) {
      result.geo_level = "subdivision";
    } else if (result.state_name) {
      result.geo_level = "state";
    } else if (result.country_name) {
      result.geo_level = "country";
    }

    warning = LOCATION_PRIVACY_WARNING;
  } else {
    warning = getLocationWarning(result);
  }
  return { result, warning };
};

export const getLocationWarning = result => {
  if (!result || !result.geo_level) {
    return LOCATION_UNRESOLVED_WARNING;
  }
  return "";
};

// An input box that fetches and shows geosearch suggestions for user input of locations.
class GeoSearchInputBox extends React.Component {
  // Fetch geosearch results and format into categories for LiveSearchBox
  handleSearchTriggered = async query => {
    let categories = {};
    let serverSideSuggestions = [];
    try {
      serverSideSuggestions = await getGeoSearchSuggestions(query);
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
    let noMatchName = "";
    if (serverSideSuggestions.length > 0) {
      noMatchName = "Use Plain Text (No Location Match)";
    } else {
      noMatchName = "No Results (Use Plain Text)";
    }
    categories[noMatchName] = {
      name: noMatchName,
      results: [{ title: query, name: query }],
    };
    return categories;
  };

  handleResultSelected = ({ result }) => {
    const { onResultSelect } = this.props;

    // Wrap plain text submission
    if (isString(result) && result !== "") result = { name: result };

    logAnalyticsEvent("GeoSearchInputBox_result_selected", {
      selected: result.name,
      // Real results will have a description
      isMatched: !!result.description,
    });

    onResultSelect && onResultSelect({ result });
  };

  render() {
    const { className, inputClassName, value } = this.props;

    return (
      <LiveSearchPopBox
        className={className}
        inputClassName={inputClassName}
        inputMode
        onResultSelect={this.handleResultSelected}
        onSearchTriggered={this.handleSearchTriggered}
        placeholder="Enter a city, region or country"
        rectangular
        value={isString(value) ? value : value.name}
      />
    );
  }
}

GeoSearchInputBox.defaultProps = {
  value: "",
};

GeoSearchInputBox.propTypes = {
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  onResultSelect: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

export default GeoSearchInputBox;
