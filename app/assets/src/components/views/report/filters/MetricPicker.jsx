import React from "react";

import PropTypes from "../../../utils/propTypes";
import OurDropdown from "../../../ui/controls/dropdowns/Dropdown";

const MetricPicker = ({ value, onChange, options }) => {
  return (
    <OurDropdown
      options={options}
      value={value}
      label="Tree Metric: "
      onChange={onChange}
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
