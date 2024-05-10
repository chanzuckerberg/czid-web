/* Note: this is a minor variant of the BackgroundModelFilter component, specifically for the Taxon Heatmap using the new SDS dropdown. Once we're ready to update the filters on other pages in the app we can make a switch so we don't have two versions. - SMB 2023-03 */

/* eslint-disable react/prop-types */
import { Dropdown } from "@czi-sds/components";
import React from "react";
import { useAllowedFeatures } from "~/components/common/UserContext";
import { REMOVE_HEATMAP_DEFAULT_BG } from "~/components/utils/features";
import { NONE_BACKGROUND } from "../../../../constants";
import { RawBackground } from "../../../../SamplesHeatmapView";
import { SDSFormattedOption } from "../../SamplesHeatmapFilters";
import { valueToName } from "../../samplesHeatmapFilterUtils";
import cs from "./samples_heatmap_background_dropdown.scss";

interface SamplesHeatmapBackgroundDropdownProps {
  allBackgrounds?: RawBackground[];
  disabled?: boolean;
  enableMassNormalizedBackgrounds?: boolean;
  label?: string;
  onChange: (background: number) => void;
  placeholder?: string;
  rounded?: boolean;
  value?: string | number | null;
  className?: string;
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
    const allowedFeatures = useAllowedFeatures();

    const backgroundValue = value || 0;

    const formatBackgroundOptions = (
      backgrounds: RawBackground[],
    ): SDSFormattedOption[] => {
      const options: SDSFormattedOption[] = [];
      if (allowedFeatures.includes(REMOVE_HEATMAP_DEFAULT_BG)) {
        options.push({
          name: NONE_BACKGROUND.name,
          text: NONE_BACKGROUND.name,
          value: 0,
          disabled: false,
        });
      }

      const backgroundOptions = backgrounds.map(background => {
        const disabledOption =
          !enableMassNormalizedBackgrounds && background.mass_normalized;
        return {
          name: background.name,
          text: background.name,
          subtext: background.mass_normalized
            ? "Normalized by input mass"
            : "Standard",
          details: background.mass_normalized
            ? "Normalized by input mass"
            : "Standard",
          value: background.value,
          disabled: disabledOption,
        };
      });
      options.push(...backgroundOptions);
      return options;
    };

    let backgroundOptions: SDSFormattedOption[] =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
        value={{
          name: valueToName(backgroundValue, backgroundOptions),
          // @ts-expect-error -- complains about the default SDS dropdown option type not having a `value` field, but we're using objects with a superset of the SDS option type
          value: backgroundValue,
        }}
        DropdownMenuProps={{
          getOptionDisabled: getOptionDisabled,
          isOptionEqualToValue: (
            option: SDSFormattedOption,
            value: SDSFormattedOption,
          ) => {
            return option.value === value.value;
          },
        }}
        InputDropdownProps={{
          sdsStyle: "minimal",
          sdsType: "label",
          disabled: disabled,
          value: valueToName(backgroundValue, backgroundOptions),
        }}
        options={backgroundOptions}
      />
    );
  },
);

SamplesHeatmapBackgroundDropdown.displayName =
  "SamplesHeatmapBackgroundDropdown";
