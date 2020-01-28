import React from "react";
import { groupBy, sortBy } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";

import LiveSearchPopBox from "./LiveSearchPopBox";

const SUGGESTED = "SUGGESTED";
const ALL = "ALL";

class SampleTypeSearchBox extends React.Component {
  handleSearchTriggered = query => {
    return this.buildResults(this.getMatchesByCategory(query), query);
  };

  getMatchesByCategory(query) {
    const matchSampleTypes = sampleType => {
      // If no query, return all possible
      if (query === "") return true;

      // Match chars in any position. Good for acronyms. Ignore spaces.
      const noSpaces = query.replace(/\s*/gi, "");
      const regex = new RegExp(noSpaces.split("").join(".*"), "gi");
      if (regex.test(sampleType.name)) {
        return true;
      }
      return false;
    };
    const matchedSampleTypes = this.props.sampleTypes.filter(matchSampleTypes);

    // Sort matches by position of match. If no position, alphabetical.
    const sortSampleTypes = sampleType => {
      const name = sampleType.name.toLowerCase();
      const q = query.toLowerCase();
      const res =
        name.indexOf(q) === -1 ? Number.MAX_SAFE_INTEGER : name.indexOf(q);
      return res;
    };
    let sortedSampleTypes = sortBy(t => t.name, matchedSampleTypes);
    if (query !== "") {
      sortedSampleTypes = sortBy(sortSampleTypes, sortedSampleTypes);
    }

    // Sample types are grouped differently based on whether the current
    // sample's host genome is an insect, a human, or neither. The "suggested"
    // group is shown first, then the "all" group.
    const getSampleTypeCategory = sampleType => {
      if (sampleType.insect_only) {
        return this.props.isInsect ? SUGGESTED : ALL;
      }
      if (sampleType.human_only) {
        return this.props.isHuman ? SUGGESTED : ALL;
      }
      // insects should only be suggested insect body parts
      return this.isInsect ? ALL : SUGGESTED;
    };
    return groupBy(getSampleTypeCategory, sortedSampleTypes);
  }

  buildResults(sampleTypesByCategory, query) {
    const formatResult = result => {
      return {
        title: result.name,
        name: result.name,
        description: this.props.showDescription ? result.group : null,
      };
    };
    const results = {};
    if (sampleTypesByCategory[SUGGESTED]) {
      results.suggested = {
        name: SUGGESTED,
        results: sampleTypesByCategory[SUGGESTED].map(formatResult),
      };
    }
    if (sampleTypesByCategory[ALL]) {
      results.all = {
        name: ALL,
        results: sampleTypesByCategory[ALL].map(formatResult),
      };
    }
    if (query.length) {
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

SampleTypeSearchBox.propTypes = {
  className: PropTypes.string,
  onResultSelect: PropTypes.func.isRequired,
  value: PropTypes.string,
  sampleTypes: PropTypes.arrayOf(PropTypes.SampleTypeProps).isRequired,
  isHuman: PropTypes.bool.isRequired,
  isInsect: PropTypes.bool.isRequired,
  showDescription: PropTypes.bool,
};

export default SampleTypeSearchBox;
