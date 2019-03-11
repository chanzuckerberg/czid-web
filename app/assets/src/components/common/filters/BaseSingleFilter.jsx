import React from "react";
import PropTypes from "prop-types";
import { find } from "lodash/fp";
import { BareDropdown as Dropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

class BaseSingleFilter extends React.Component {
  handleChange = value => {
    const { onChange, options } = this.props;
    onChange && onChange(find({ value }, options));
  };

  render() {
    const { label, options, selected } = this.props;

    return (
      <Dropdown
        trigger={<div className={cs.filterLabel}>{label}</div>}
        menuLabel={`Select ${label}`}
        options={options}
        onChange={this.handleChange}
        value={selected}
      />
    );
  }
}

BaseSingleFilter.propTypes = {
  selected: PropTypes.array,
  onChange: PropTypes.func,
  options: PropTypes.array,
  counters: PropTypes.object,
  label: PropTypes.string
};

export default BaseSingleFilter;
