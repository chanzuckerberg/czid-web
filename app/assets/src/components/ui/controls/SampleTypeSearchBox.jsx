import React from "react";
import PropTypes from "prop-types";

import LiveSearchPopBox from "./LiveSearchPopBox";

class SampleTypeSearchBox extends React.Component {
  handleSearchTriggered = query => {
    const categories = {};

    // From https://docs.google.com/spreadsheets/d/1_hPkQe5LI0Zw_C0Ls4HVCEDsc_FNNVOaU_aAfoaiZRE/
    const results = [
      { title: "Plasma", name: "plasma", description: "Systemic Inflammation" },
      { title: "Serum", name: "serum", description: "Systemic Inflammation" },
      {
        title: "Whole Blood",
        name: "whole blood",
        description: "Systemic Inflammation",
      },

      { title: "Brain", name: "brain", description: "CNS Infections" },
      {
        title: "Cerebrospinal Fluid (CSF)",
        name: "Cerebrospinal Fluid (CSF)",
        description: "CNS Infections",
      },
      {
        title: "Ocular Fluid",
        name: "Ocular Fluid",
        description: "CNS Infections",
      },
    ];

    categories["ALL"] = {
      name: "ALL",
      results,
    };

    categories["NO_MATCH"] = {
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
};

export default SampleTypeSearchBox;
