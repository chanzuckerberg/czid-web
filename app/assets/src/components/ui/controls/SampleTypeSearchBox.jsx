import React from "react";
import PropTypes from "prop-types";

import LiveSearchPopBox from "./LiveSearchPopBox";

class SampleTypeSearchBox extends React.Component {
  handleSearchTriggered = query => {
    const categories = {};

    const results = [
      // TODO (gdingle):
      { title: "TODO MATCH", name: "TODO MATCH" },
    ];

    categories["ALL"] = {
      name: "ALL",
      results,
    };

    categories["NO_MATCH"] = {
      name: "Use Plain Text (No Match)",
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
  onResultSelect: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};

export default SampleTypeSearchBox;
