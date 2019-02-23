import React from "react";
import PropTypes from "prop-types";
import { MultipleDropdown } from "~ui/controls/dropdowns";

class AsyncFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: [],
      value: []
    };
  }

  handleChange = selected => {
    console.log("selected", selected);
  };

  render() {
    const { options, value } = this.state;

    return (
      <MultipleDropdown
        {...this.props}
        fluid
        hideCounter
        rounded
        search
        checkedOnTop
        onChange={this.handleChange}
        options={options}
        value={value}
      />
    );
  }
}

AsyncFilter.propTypes = {};

export default AsyncFilter;
