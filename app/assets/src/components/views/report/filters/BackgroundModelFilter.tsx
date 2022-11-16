/* eslint-disable react/prop-types */
import React from "react";

import { NumberId } from "~/interface/shared";
import SectionsDropdown from "~ui/controls/dropdowns/SectionsDropdown";
import SubtextDropdown from "~ui/controls/dropdowns/SubtextDropdown";

interface BackgroundModelFilterProps {
  allBackgrounds?: NumberId[];
  categorizeBackgrounds?: boolean;
  otherBackgrounds?: NumberId[];
  ownedBackgrounds?: NumberId[];
  disabled?: boolean;
  enableMassNormalizedBackgrounds?: boolean;
  label?: string;
  onChange: $TSFixMeFunction;
  onClick?: $TSFixMeFunction;
  placeholder?: string;
  rounded?: boolean;
  value?: number;
}

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
  }: BackgroundModelFilterProps) => {
    let disabled = props.disabled || false;

    const formatBackgroundOptions = (backgrounds: $TSFixMe) =>
      backgrounds.map((background: $TSFixMe) => {
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

    if (categorizeBackgrounds) {
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
        // @ts-expect-error Property 'value' does not exist on type 'NumberId'
        result[bg.id || bg.value] = bg.name || bg.text;
        return result;
      }, {});

      return (
        <SectionsDropdown
          categories={backgroundSections}
          disabled={disabled}
          // @ts-expect-error Property 'fluid' does not exist on type
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
          // @ts-expect-error Property 'disabled' does not exist on type
          disabled={disabled}
          onChange={onChange}
          onClick={onClick}
          nullLabel="None"
          search
        />
      );
    }
  },
);

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'Na... Remove this comment to see the full error message
BackgroundModelFilter.defaultProps = {
  rounded: true,
  label: "Background",
};

BackgroundModelFilter.displayName = "BackgroundModelFilter";

export default BackgroundModelFilter;
