/* Note: this is a minor variant of the BackgroundModelFilter component, specifically for the Taxon Heatmap using the new SDS dropdown. Once we're ready to update the filters on other pages in the app we can make a switch so we don't have two versions. - SMB 2023-03 */

/* eslint-disable react/prop-types */
import { Dropdown } from "@czi-sds/components";
import React from "react";
import { SDSFormattedOption } from "../../SamplesHeatmapFilters";
import { valueToName } from "../../samplesHeatmapFilterUtils";
import cs from "./samples_heatmap_background_dropdown.scss";

interface SamplesHeatmapBackgroundDropdownProps {
  allBackgrounds?: RawBackground[];
  disabled?: boolean;
  enableMassNormalizedBackgrounds?: boolean;
  label?: string;
  onChange: $TSFixMeFunction;
  placeholder?: string;
  rounded?: boolean;
  value?: string | number;
  className?: string;
}

export interface RawBackground {
  mass_normalized?: boolean;
  text?: string;
  name?: string;
  id?: number;
  value?: number;
}

export const SamplesHeatmapBackgroundDropdown = React.memo(
  ({
    allBackgrounds,
    enableMassNormalizedBackgrounds,
    onChange,
    value,
    ...props
  }: SamplesHeatmapBackgroundDropdownProps) => {
    let disabled = props.disabled || false;

    const formatBackgroundOptions = (
      backgrounds: RawBackground[],
    ): SDSFormattedOption[] => {
      return backgrounds.map(background => {
        const disabledOption =
          !enableMassNormalizedBackgrounds && background.mass_normalized;
        return {
          name: background.name || background.text,
          text: background.name || background.text,
          subtext: background.mass_normalized
            ? "Normalized by input mass"
            : "Standard",
          details: background.mass_normalized
            ? "Normalized by input mass"
            : "Standard",
          value: background.id || background.value,
          disabled: disabledOption,
        };
      });
    };

    let backgroundOptions: SDSFormattedOption[] =
      formatBackgroundOptions(allBackgrounds);
    if (backgroundOptions.length === 0) {
      backgroundOptions = [
        { name: "No background models to display", value: -1 },
      ];
      disabled = true;
    }

    const getOptionDisabled = (option: any) => option.disabled;
    return (
      <Dropdown
        label={<div className={cs.label}>Background</div>}
        search={true}
        onChange={newValue => {
          // @ts-expect-error -- same as the line below
          if (newValue?.value !== undefined) {
            // @ts-expect-error -- complains about the default SDS dropdown option type not having a `value` field, but we're using objects with a superset of the SDS option type
            onChange(newValue?.value);
          }
        }}
        // @ts-expect-error -- complains about the default SDS dropdown option type not having a `value` field, but we're using objects with a superset of the SDS option type
        value={{ name: valueToName(value, backgroundOptions), value: value }}
        DropdownMenuProps={{
          getOptionDisabled: getOptionDisabled,
          isOptionEqualToValue: (option, value) => option.value === value,
        }}
        InputDropdownProps={{
          sdsStyle: "minimal",
          disabled: disabled,
          details: valueToName(value, backgroundOptions),
        }}
        options={backgroundOptions}
      />
    );
  },
);

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'Na... Remove this comment to see the full error message
SamplesHeatmapBackgroundDropdown.defaultProps = {
  rounded: true,
  label: "Background",
};

SamplesHeatmapBackgroundDropdown.displayName =
  "SamplesHeatmapBackgroundDropdown";
