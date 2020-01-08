import React from "react";
import PropTypes from "prop-types";

import LiveSearchPopBox from "./LiveSearchPopBox";

class SampleTypeSearchBox extends React.Component {
  handleSearchTriggered = query => {
    console.log("handleSearchTriggered", query);

    const results = [
      // TODO (gdingle): or use name/title?
      { title: "TODO", description: "TODO", key: "TODO" },
    ];

    const categories = {};

    categories["ALL"] = {
      name: "ALL",
      // Format title/description for the text box.
      results,
    };

    categories["NO_MATCH"] = {
      name: "Use Plain Text (No Match)",
      results: [{ title: query, name: query }],
    };
    console.log(categories);

    return categories;
  };

  render() {
    const { className, value } = this.props;
    return (
      <LiveSearchPopBox
        className={className}
        value={value}
        onSearchTriggered={this.handleSearchTriggered}
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
