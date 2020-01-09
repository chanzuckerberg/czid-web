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
      if (this.props.isInsect && sampleType.insect_only) return "suggested";
      if (this.props.isHuman && sampleType.human_only) return "suggested";
      if (!(sampleType.insect_only || sampleType.human_only))
        return "suggested";
      return "all";
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
    // Insects are in a category all to themselves.
    if (suggestedSampleTypes.all && !this.props.isInsect) {
      results.all = {
        name: "ALL",
        results: suggestedSampleTypes.all.map(formatResult),
      };
    }
    // Always lowercase plain text input to distinguish it from Title Case
    // offical sample types, which are enforced in SampleType.rb.
    // TODO (gdingle): enforce lowercasing in CSV upload as well.
    const lowered = query.toLowerCase();
    return {
      ...results,
      noMatch: {
        name: "Use Plain Text (No Match)",
        results: [{ title: lowered, name: lowered }],
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
