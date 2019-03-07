import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
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
    // this.starts = {
    //   "1_week": (end) => end.subtract(7, 'days').calendar(),
    //   "1_month": (end) => end.subtract(1, 'months').calendar(),
    //   "3_month": (end) => end.subtract(3, 'months').calendar(),
    //   "6_month": (end) => end.subtract(6, 'months').calendar(),
    //   "1_year": (end) => end.subtract(1, 'years').calendar()
    // }
  }

  handleChange = selected => {
    const { onChange } = this.props;

    const selectedOption = find({ value: selected }, this.options);
    onChange && onChange(selectedOption);

    // if (selectedOption.value !== "all_time") {
    //   let end = moment();
    //   let start = this.starts[selected](end);
    //   onChange && onChange(selectedOption, [start, end]);
    // } else {
    // }
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
