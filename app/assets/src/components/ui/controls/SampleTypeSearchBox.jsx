import React from "react";
import { groupBy, sortBy } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";

import LiveSearchPopBox from "./LiveSearchPopBox";

const SUGGESTED = "SUGGESTED";
const DONOTSHOW = "DONOTSHOW";
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
      // Insects only get their own types
      if (this.props.isInsect) {
        return sampleType.insect_only ? SUGGESTED : DONOTSHOW;
      }
      // Other categories do not get insect types
      if (sampleType.insect_only) {
        return DONOTSHOW;
      }
      // Humans get any type except those for insects
      if (this.props.isHuman) {
        return SUGGESTED;
      }
      // Non-human animals get suggested a subset
      return sampleType.human_only ? ALL : SUGGESTED;
    };
    return groupBy(getSampleTypeCategory, sortedSampleTypes);
  }

  buildResults(sampleTypesByCategory, query) {
    const formatResult = result => {
      return {
        title: result.name,
        name: result.name,
        description: result.group,
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
    // TODO (gdingle): new icon is not working!!!
    return (
      <LiveSearchPopBox
        className={className}
        value={value}
        onSearchTriggered={this.handleSearchTriggered}
        onResultSelect={onResultSelect}
        minChars={0}
        placeholder=""
        icon="search"
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
};

export default SampleTypeSearchBox;
