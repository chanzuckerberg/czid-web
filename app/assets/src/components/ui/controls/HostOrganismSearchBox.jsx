import React from "react";
import { sortBy, get } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";

import LiveSearchPopBox from "./LiveSearchPopBox";

// Adapted from SampleTypeSearchBox
class HostOrganismSearchBox extends React.Component {
  handleSearchTriggered = query => {
    return this.buildResults(this.getMatchesByCategory(query), query);
  };

  // TODO (gdingle): extract all these to utils if re-used
  getMatchesByCategory(query) {
    const matchHostGenomes = hostGenome => {
      // If no query, return all possible
      if (query === "") return true;

      // Match chars in any position. Good for acronyms. Ignore spaces.
      const noSpaces = query.replace(/\s*/gi, "");
      const regex = new RegExp(noSpaces.split("").join(".*"), "gi");
      if (regex.test(hostGenome.name)) {
        return true;
      }
      return false;
    };
    const matchedHostGenomes = this.props.hostGenomes.filter(matchHostGenomes);

    // Sort matches by position of match. If no position, alphabetical.
    const sortHostGenomes = hostGenome => {
      const name = hostGenome.name.toLowerCase();
      const q = query.toLowerCase();
      const res =
        name.indexOf(q) === -1 ? Number.MAX_SAFE_INTEGER : name.indexOf(q);
      return res;
    };
    let sortedHostGenomes = sortBy(
      t => t.samples_count * -1,
      matchedHostGenomes
    );
    if (query !== "") {
      sortedHostGenomes = sortBy(sortHostGenomes, sortedHostGenomes);
    }

    return sortedHostGenomes;
  }

  buildResults(sortedHostGenomes, query) {
    const formatResult = result => {
      return {
        title: result.name,
        name: result.id,
      };
    };
    const results = {};
    if (sortedHostGenomes) {
      results.suggested = {
        name: "SUGGESTED",
        results: sortedHostGenomes.map(formatResult),
      };
    }
    if (query.length && get([0, "name"], sortedHostGenomes) !== query) {
      results.noMatch = {
        name: "Use Plain Text (No Match)",
        results: [{ title: query, name: query }],
      };
    }
    return results;
  }

  render() {
    const { className, value, onResultSelect } = this.props;
    return (
      <LiveSearchPopBox
        className={className}
        value={value}
        onSearchTriggered={this.handleSearchTriggered}
        onResultSelect={onResultSelect}
        minChars={0}
        placeholder=""
        icon="chevron down"
        shouldSearchOnFocus={true}
        delayTriggerSearch={0}
      />
    );
  }
}

HostOrganismSearchBox.propTypes = {
  className: PropTypes.string,
  onResultSelect: PropTypes.func.isRequired,
  value: PropTypes.string,
  hostGenomes: PropTypes.arrayOf(PropTypes.HostGenome).isRequired,
};

export default HostOrganismSearchBox;
