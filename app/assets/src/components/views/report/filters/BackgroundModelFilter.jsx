import React from "react";

import PropTypes from "../../../utils/propTypes";
import OurDropdown from "../../../ui/controls/dropdowns/Dropdown";

const BackgroundModelFilter = ({ allBackgrounds, value, onChange }) => {
  let disabled = false;
  let backgroundOptions = allBackgrounds.map(background => {
    return { text: background.name, value: background.id };
  });
  if (backgroundOptions.length == 0) {
    backgroundOptions = [
      { text: "No background models to display", value: -1 }
    ];
    disabled = true;
  }
  return (
    <OurDropdown
      options={backgroundOptions}
      value={value}
      disabled={disabled}
      label="Background: "
      onChange={onChange}
    />
  );
};

BackgroundModelFilter.propTypes = {
  allBackgrounds: PropTypes.arrayOf(PropTypes.BackgroundData),
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired
};

export default BackgroundModelFilter;
