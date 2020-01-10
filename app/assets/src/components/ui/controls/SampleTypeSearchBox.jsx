import React from "react";
import { groupBy } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";

import LiveSearchPopBox from "./LiveSearchPopBox";

const SUGGESTED = "SUGGESTED";
const DONOTSHOW = "DONOTSHOW";
const ALL = "ALL";

class SampleTypeSearchBox extends React.Component {
  handleSearchTriggered = query => {
    const matchSampleTypes = sampleType => {
      // Match chars in any position. Good for acronyms. Ignore spaces.
      const noSpaces = query.replace(/\s*/gi, "");
      const regex = new RegExp(noSpaces.split("").join(".*"), "gi");
      if (regex.test(sampleType.name)) {
        return true;
      }
      return false;
    };
    const matchedSampleTypes = this.props.sampleTypes.filter(matchSampleTypes);

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
    const sampleTypesByCategory = groupBy(
      getSampleTypeCategory,
      matchedSampleTypes
    );

    return this.buildResults(sampleTypesByCategory, query);
  };

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
    return {
      ...results,
      noMatch: {
        name: "Use Plain Text (No Match)",
        results: [{ title: query, name: query }],
      },
    };
  }

  render() {
    const { className, value, onResultSelect } = this.props;
    return (
      <LiveSearchPopBox
        className={className}
        value={value}
        onSearchTriggered={this.handleSearchTriggered}
        onResultSelect={onResultSelect}
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
