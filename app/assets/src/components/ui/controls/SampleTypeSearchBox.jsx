import React from "react";
import { groupBy } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";

import LiveSearchPopBox from "./LiveSearchPopBox";

class SampleTypeSearchBox extends React.Component {
  handleSearchTriggered = query => {
    const matchSampleTypes = sampleType => {
      // Match chars in any position. Good for acronyms.
      const regex = new RegExp(query.split("").join(".*"), "gi");
      if (regex.test(sampleType.name)) {
        return true;
      }
      return false;
    };
    const matchedSampleTypes = this.props.sampleTypes.filter(matchSampleTypes);

    const isSuggested = sampleType => {
      // Insects only get their own types
      if (this.props.isInsect) {
        return sampleType.insect_only ? "suggested" : "donotshow";
      }
      // Humans get any type
      if (this.props.isHuman) {
        return "suggested";
      }
      // Non-human animals get suggested a subset
      return sampleType.human_only ? "all" : "suggested";
    };
    const suggestedSampleTypes = groupBy(isSuggested, matchedSampleTypes);

    return this.buildResults(suggestedSampleTypes, query);
  };

  buildResults(suggestedSampleTypes, query) {
    const formatResult = result => {
      return {
        title: result.name,
        name: result.name,
        description: result.group,
      };
    };
    const results = {};
    if (suggestedSampleTypes.suggested) {
      results.suggested = {
        name: "SUGGESTED",
        results: suggestedSampleTypes.suggested.map(formatResult),
      };
    }
    if (suggestedSampleTypes.all) {
      results.all = {
        name: "ALL",
        results: suggestedSampleTypes.all.map(formatResult),
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
  sampleTypes: PropTypes.arrayOf(PropTypes.SampleTypeType).isRequired,
  isHuman: PropTypes.bool.isRequired,
  isInsect: PropTypes.bool.isRequired,
};

export default SampleTypeSearchBox;
