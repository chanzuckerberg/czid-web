import React from "react";
import PropTypes from "prop-types";
import { BareDropdown as Dropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

class BaseSingleFilter extends React.Component {
  render() {
    const { label, onChange, options, selected } = this.props;

    return (
      <Dropdown
        trigger={<div className={cs.filterLabel}>{label}</div>}
        menuLabel={`Select ${label}`}
        options={options}
        onChange={onChange}
        value={selected}
      />
    );
  }
}

BaseSingleFilter.propTypes = {
  selected: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.array,
  counters: PropTypes.object,
  label: PropTypes.string
};

export default BaseSingleFilter;
