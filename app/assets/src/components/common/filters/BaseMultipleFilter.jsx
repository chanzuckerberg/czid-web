import React from "react";
import PropTypes from "prop-types";
import { find, map } from "lodash/fp";
import { MultipleDropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

class BaseMultipleFilter extends React.Component {
  handleChange = selected => {
    const { onChange, options } = this.props;
    onChange && onChange(selected.map(value => find({ value }, options)));
  };

  render() {
    const { label, options, selected } = this.props;

    return (
      <MultipleDropdown
        checkedOnTop
        search
        fluid
        arrowInsideTrigger={false}
        trigger={<div className={cs.filterLabel}>{label}</div>}
        menuLabel={`Select ${label}`}
        options={options}
        value={map("value", selected)}
        onChange={this.handleChange}
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
