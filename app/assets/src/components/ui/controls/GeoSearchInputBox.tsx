import { compact, get, isString } from "lodash/fp";
import React from "react";
import { trackEvent } from "~/api/analytics";
import { getGeoSearchSuggestions } from "~/api/locations";
import { LocationObject } from "~/interface/shared";
import LiveSearchPopBox, { SearchResults } from "~ui/controls/LiveSearchPopBox";

export const LOCATION_PRIVACY_WARNING =
  "Changed to county/district level for personal privacy.";
export const LOCATION_UNRESOLVED_WARNING =
  // this is the max length to appear on one line
  "No match. Sample will not appear on maps.";

// Process location selections for humans.
export const processLocationSelection = (
  location: LocationObject | string,
  isHuman: boolean,
) => {
  // For human samples, drop the city part of the name and show a warning.
  // NOTE: The backend will redo the geosearch for confirmation and re-apply
  // this restriction.
  if (
    isHuman &&
    typeof location !== "string" &&
    get("geo_level", location) === "city"
  ) {
    const result: LocationObject = Object.assign({}, location); // make a copy to avoid side effects

    // If the subdivision name is identical to the city name, remove the subdivision name as well to be safe.
    if (result.subdivision_name === result.city_name) {
      result.subdivision_name = "";
    }
    // Remove the city name.
    result.city_name = "";

    // Mark the result so that the back-end will know to refetch it.
    result.refetch_adjusted_location = true;

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
    return result;
  }

  return location;
};

export const getLocationWarning = result => {
  if (!result || !result.geo_level) {
    return LOCATION_UNRESOLVED_WARNING;
  }
  // If the result was processed due to privacy reasons, show a warning.
  if (result.refetch_adjusted_location) {
    return LOCATION_PRIVACY_WARNING;
  }
  return "";
};

interface GeoSearchInputBoxProps {
  className?: string;
  inputClassName?: string;
  onResultSelect?(params: any): void;
  value?: { name: string } | string;
}

/** An input box that fetches and shows geosearch suggestions for user input of locations. */
const GeoSearchInputBox = ({
  className,
  inputClassName,
  onResultSelect,
  value = "",
}: GeoSearchInputBoxProps) => {
  // Fetch geosearch results and format into categories for LiveSearchBox
  const handleSearchTriggered = async (query: string) => {
    const categories: SearchResults = {};
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
      trackEvent("GeoSearchInputBox_location_queried", {
        query: query,
        numResults: serverSideSuggestions.length,
      });
    } catch (e) {
      // In the case of an error (e.g. no API key in dev), just catch and show the plain text option.
      // eslint-disable-next-line no-console
      console.log(e);
      trackEvent("GeoSearchInputBox_request_erred", {
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

  const handleResultSelected = ({ result }) => {
    // Wrap plain text submission
    if (isString(result) && result !== "") result = { name: result };

    trackEvent("GeoSearchInputBox_result_selected", {
      selected: result.name,
      // Real results will have a description
      isMatched: !!result.description,
    });

    onResultSelect && onResultSelect({ result });
  };

  return (
    <LiveSearchPopBox
      className={className}
      inputClassName={inputClassName}
      inputMode
      onResultSelect={handleResultSelected}
      onSearchTriggered={handleSearchTriggered}
      placeholder="Enter a city, region or country"
      rectangular
      value={isString(value) ? value : value.name}
    />
  );
};

export default GeoSearchInputBox;
