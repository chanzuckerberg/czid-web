import React, { useContext } from "react";

import { UserContext } from "~/components/common/UserContext";
import { IMPROVED_BG_MODEL_SELECTION_FEATURE } from "~/components/utils/features";
import SectionsDropdown from "~ui/controls/dropdowns/SectionsDropdown";
import SubtextDropdown from "~ui/controls/dropdowns/SubtextDropdown";
import PropTypes from "~utils/propTypes";

const BackgroundModelFilter = React.memo(
  ({
    allBackgrounds,
    enableMassNormalizedBackgrounds,
    onClick,
    ownedBackgrounds,
    otherBackgrounds,
    onChange,
    value,
    categorizeBackgrounds = false,
    ...props
  }) => {
    const userContext = useContext(UserContext);
    const { allowedFeatures } = userContext || {};

    let disabled = props.disabled || false;

    const formatBackgroundOptions = backgrounds =>
      backgrounds.map(background => {
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

    let backgroundOptions = formatBackgroundOptions(allBackgrounds);
    if (backgroundOptions.length === 0) {
      backgroundOptions = [
        { text: "No background models to display", value: -1 },
      ];
      disabled = true;
    }

    if (
      allowedFeatures.includes(IMPROVED_BG_MODEL_SELECTION_FEATURE) &&
      categorizeBackgrounds
    ) {
      const backgroundSections = {
        MY_BACKGROUNDS: {
          displayName: "My Backgrounds",
          options: formatBackgroundOptions(ownedBackgrounds),
          emptySectionMessage: "You haven't created any backgrounds yet.",
        },
        OTHER_BACKGROUNDS: {
          displayName: "Other Backgrounds",
          options: formatBackgroundOptions(otherBackgrounds),
        },
      };

      // Creates mapping between the value (id) of the background model and name.
      // This is needed so the dropdown trigger can properly render the background's name and not just the ID.
      const backgroundIdToName = [
        ...ownedBackgrounds,
        ...otherBackgrounds,
      ].reduce((result, bg) => {
        result[bg.id || bg.value] = bg.name || bg.text;
        return result;
      }, {});

      return (
        <SectionsDropdown
          categories={backgroundSections}
          disabled={disabled}
          fluid
          itemIdToName={backgroundIdToName}
          onChange={onChange}
          onClick={onClick}
          search
          selectedValue={value}
          nullLabel="None"
          floating
          {...props}
        />
      );
    } else {
      return (
        <SubtextDropdown
          {...props}
          options={backgroundOptions}
          initialSelectedValue={value}
          disabled={disabled}
          onChange={onChange}
          onClick={onClick}
          nullLabel="None"
          search
        />
      );
    }
  }
);

BackgroundModelFilter.defaultProps = {
  rounded: true,
  label: "Background",
};

BackgroundModelFilter.propTypes = {
  allBackgrounds: PropTypes.arrayOf(PropTypes.BackgroundData),
  categorizeBackgrounds: PropTypes.bool,
  otherBackgrounds: PropTypes.arrayOf(PropTypes.BackgroundData),
  ownedBackgrounds: PropTypes.arrayOf(PropTypes.BackgroundData),
  disabled: PropTypes.bool,
  enableMassNormalizedBackgrounds: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  placeholder: PropTypes.string,
  rounded: PropTypes.bool,
  value: PropTypes.number,
};

export default BackgroundModelFilter;
