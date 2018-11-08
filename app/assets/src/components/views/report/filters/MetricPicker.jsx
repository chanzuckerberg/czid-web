import React from "react";

import PropTypes from "../../../utils/propTypes";
import Dropdown from "../../../ui/controls/dropdowns/Dropdown";

const MetricPicker = ({ value, onChange, options }) => {
  return (
    <Dropdown
      options={options}
      value={value}
      label="Tree Metric: "
      onChange={onChange}
      rounded
    />
  );
};

MetricPicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      value: PropTypes.string
    })
  )
};

export default MetricPicker;
