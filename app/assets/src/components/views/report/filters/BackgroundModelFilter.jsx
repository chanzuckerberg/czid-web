import React, { useContext } from "react";

import { UserContext } from "~/components/common/UserContext";
import { IMPROVED_BG_MODEL_SELECTION_FEATURE } from "~/components/utils/features";
import SubtextDropdown from "~ui/controls/dropdowns/SubtextDropdown";
import PropTypes from "~utils/propTypes";

const BackgroundModelFilter = React.memo(
  ({
    allBackgrounds,
    enableMassNormalizedBackgrounds,
    onClick,
    onChange,
    value,
    ...props
  }) => {
    const userContext = useContext(UserContext);
    const { allowedFeatures } = userContext || {};

    let disabled = props.disabled || false;
    let backgroundOptions = allBackgrounds.map(background => {
      const disabledOption =
        !enableMassNormalizedBackgrounds && background.mass_normalized;
      return {
        text: background.name || background.text,
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
      <SubtextDropdown
        {...props}
        search={allowedFeatures.includes(IMPROVED_BG_MODEL_SELECTION_FEATURE)}
        options={backgroundOptions}
        initialSelectedValue={value}
        disabled={disabled}
        onChange={onChange}
        onClick={onClick}
        nullLabel="None"
      />
    );
  }
);

BackgroundModelFilter.defaultProps = {
  rounded: true,
  label: "Background",
};

BackgroundModelFilter.propTypes = {
  allBackgrounds: PropTypes.arrayOf(PropTypes.BackgroundData),
  disabled: PropTypes.bool,
  enableMassNormalizedBackgrounds: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  placeholder: PropTypes.string,
  rounded: PropTypes.bool,
  selectedInvalidBackground: PropTypes.bool,
  value: PropTypes.number,
};

export default BackgroundModelFilter;
