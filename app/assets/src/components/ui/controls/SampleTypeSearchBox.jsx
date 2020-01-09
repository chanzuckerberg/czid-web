import React from "react";
import { groupBy } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";

import LiveSearchPopBox from "./LiveSearchPopBox";

class SampleTypeSearchBox extends React.Component {
  handleSearchTriggered = query => {
    const categories = {};

    const isSuggested = sampleType => {
      if (this.props.isInsect && sampleType.insect_only) return "suggested";
      if (this.props.isHuman && sampleType.human_only) return "suggested";
      if (!(sampleType.insect_only || sampleType.human_only))
        return "suggested";
      return "all";
    };
    const suggestedSampleTypes = groupBy(isSuggested, this.props.sampleTypes);

    // TODO (gdingle): filter results by exact substring match
    // TODO: ignore special chars?

    const formatResult = result => {
      return {
        title: result.name,
        name: result.name,
        description: result.group,
      };
    };

    categories.suggested = {
      name: "SUGGESTED",
      results: suggestedSampleTypes.suggested.map(formatResult),
    };

    // NOTE: "OTHER" would be a more accurate description, but "all" was the
    // word in the design at https://chanzuckerberg.invisionapp.com/share/A6V572ZSBU5#/screens/396544828 .
    categories.all = {
      name: "ALL",
      results: suggestedSampleTypes.all.map(formatResult),
    };

    categories.noMatch = {
      name: "Use Plain Text (No Match)",
      // TODO (gdingle): lowercase plain text to distinguish?
      results: [{ title: query, name: query }],
    };

    return categories;
  };

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
