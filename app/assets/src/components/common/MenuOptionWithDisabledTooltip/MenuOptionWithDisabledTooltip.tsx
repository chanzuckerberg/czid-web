import { MenuItem, Tooltip } from "@czi-sds/components";
import React from "react";
import { SDSFormattedOption } from "~/components/views/SamplesHeatmapView/components/SamplesHeatmapFilters/SamplesHeatmapFilters";

interface MenuOptionWithDisabledTooltipProps {
  option: SDSFormattedOption;
  optionProps: any;
  tooltipDisplay: JSX.Element;
}

export const MenuOptionWithDisabledTooltip = ({
  option,
  optionProps,
  tooltipDisplay,
}: MenuOptionWithDisabledTooltipProps) => {
  return (
    <Tooltip
      arrow
      key={option.value}
      title={option.disabled ? tooltipDisplay : ""}
      placement="top"
      sdsStyle="light"
    >
      <span>
        <MenuItem
          key={option.value}
          disabled={option.disabled}
          {...optionProps}
        >
          {option.text}
        </MenuItem>
      </span>
    </Tooltip>
  );
};
