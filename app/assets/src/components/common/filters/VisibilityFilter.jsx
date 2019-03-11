import React from "react";
import PropTypes from "prop-types";
import { find } from "lodash/fp";
import { BareDropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

class VisibilityFilter extends React.Component {
  constructor(props) {
    super(props);

    this.options = [
      { value: "public", text: "Public" },
      { value: "private", text: "Private" }
    ];
  }

  handleChange = selected => {
    const { onChange } = this.props;
    const selectedOption = find({ value: selected }, this.options);
    onChange && onChange(selectedOption);
  };

  render() {
    const { selected } = this.props;
    return (
      <BareDropdown
        trigger={<div className={cs.filterLabel}>Visibility</div>}
        options={this.options}
        onChange={this.handleChange}
        value={selected}
      />
    );
  }
}

VisibilityFilter.propTypes = {
  selected: PropTypes.string,
  onChange: PropTypes.func,
  counters: PropTypes.object
};

export default VisibilityFilter;
