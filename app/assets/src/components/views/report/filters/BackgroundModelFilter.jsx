import React from "react";

import { UserContext } from "~/components/common/UserContext";
import PropTypes from "../../../utils/propTypes";
import SubtextDropdown from "~ui/controls/dropdowns/SubtextDropdown";
import Dropdown from "~ui/controls/dropdowns/Dropdown";

const BackgroundModelFilter = ({
  allBackgrounds,
  value,
  onChange,
  enableMassNormalizedBackgrounds,
}) => {
  let disabled = false;
  let backgroundOptions = allBackgrounds.map(background => {
    const disabledOption =
      !enableMassNormalizedBackgrounds && background.mass_normalized;
    return {
      text: background.name,
      subtext: background.mass_normalized
        ? "Normalized by input mass"
        : "Standard",
      value: background.id || background.value,
      disabled: disabledOption,
      tooltip: disabledOption
        ? "Only for ERCC samples run on Pipeline v4.0 or later"
        : null,
    };
  });
  if (backgroundOptions.length === 0) {
    backgroundOptions = [
      { text: "No background models to display", value: -1 },
    ];
    disabled = true;
  }
  return (
    <UserContext.Consumer>
      {currentUser =>
        currentUser.allowedFeatures.includes("mass_normalized") ? (
          <SubtextDropdown
            options={backgroundOptions}
            initialSelectedValue={value}
            disabled={disabled}
            label="Background"
            onChange={onChange}
            rounded
          />
        ) : (
          <Dropdown
            options={backgroundOptions}
            value={value}
            disabled={disabled}
            label="Background"
            onChange={onChange}
            rounded
          />
        )
      }
    </UserContext.Consumer>
  );
};

BackgroundModelFilter.propTypes = {
  allBackgrounds: PropTypes.arrayOf(PropTypes.BackgroundData),
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  enableMassNormalizedBackgrounds: PropTypes.bool,
};

export default BackgroundModelFilter;
