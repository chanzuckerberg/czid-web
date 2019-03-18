import React from "react";
import PropTypes from "prop-types";
import { MultipleDropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

class BaseMultipleFilter extends React.Component {
  render() {
    const { label, onChange, options, selected } = this.props;

    return (
      <MultipleDropdown
        checkedOnTop
        search
        fluid
        arrowInsideTrigger={false}
        trigger={<div className={cs.filterLabel}>{label}</div>}
        menuLabel={`Select ${label}`}
        options={options}
        value={selected}
        onChange={onChange}
      />
    );
  }
}

BaseMultipleFilter.propTypes = {
  selected: PropTypes.array,
  onChange: PropTypes.func,
  options: PropTypes.array,
  counters: PropTypes.object,
  label: PropTypes.string
};

export default BaseMultipleFilter;
