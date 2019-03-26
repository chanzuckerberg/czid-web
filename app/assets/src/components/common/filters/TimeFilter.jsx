import React from "react";
import PropTypes from "prop-types";
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

  render() {
    const { onChange, selected } = this.props;
    return (
      <Dropdown
        trigger={<div className={cs.filterLabel}>Time</div>}
        menuLabel="Timeframe"
        options={this.options}
        onChange={onChange}
        value={selected}
      />
    );
  }
}

TimeFilter.propTypes = {
  selected: PropTypes.string,
  onChange: PropTypes.func,
  counters: PropTypes.object
};

export default TimeFilter;
