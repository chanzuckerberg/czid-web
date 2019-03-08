import React from "react";
import PropTypes from "prop-types";
import { find } from "lodash/fp";
import { BareDropdown as Dropdown } from "~ui/controls/dropdowns";
import cs from "./filters.scss";

class TimeFilter extends React.Component {
  constructor(props) {
    super(props);

    this.options = [
      { value: "1_week", text: "Last week" },
      { value: "1_month", text: "Last month" },
      { value: "3_month", text: "Last 3 months" },
      { value: "6_month", text: "Last 6 months" },
      { value: "1_year", text: "Last year" }
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
      <Dropdown
        trigger={<div className={cs.filterLabel}>Time</div>}
        menuLabel="Timeframe"
        options={this.options}
        onChange={this.handleChange}
        value={selected && selected.value}
      />
    );
  }
}

TimeFilter.propTypes = {
  selected: PropTypes.object,
  onChange: PropTypes.func,
  counters: PropTypes.object
};

export default TimeFilter;
