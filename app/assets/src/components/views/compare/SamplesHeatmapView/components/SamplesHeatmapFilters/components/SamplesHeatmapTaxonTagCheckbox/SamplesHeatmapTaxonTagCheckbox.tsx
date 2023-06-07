import Checkbox from "@mui/material/Checkbox";
import { Icon, Tooltip } from "czifui";
import React from "react";
import { SelectedOptions } from "~/interface/shared";
import cs from "../../samples_heatmap_filters.scss";

interface SamplesHeatmapTaxonTagCheckboxProps {
  label: string;
  value: string;
  selectedOptions: SelectedOptions;
  onSelectedOptionsChange: (selectedOptions: SelectedOptions) => void;
  showInfoIcon?: boolean;
  infoIconTooltipContent?: any;
  disabled?: boolean;
}

export const SamplesHeatmapTaxonTagCheckbox = ({
  label,
  value,
  selectedOptions,
  onSelectedOptionsChange,
  showInfoIcon,
  infoIconTooltipContent,
  disabled,
}: SamplesHeatmapTaxonTagCheckboxProps) => {
  const onTaxonTagChange = value => {
    if (selectedOptions.taxonTags.includes(value)) {
      onSelectedOptionsChange({
        taxonTags: selectedOptions.taxonTags.filter(tag => tag !== value),
      });
    } else {
      onSelectedOptionsChange({
        taxonTags: [...selectedOptions.taxonTags, value],
      });
    }
  };

  return (
    <div>
      <Checkbox
        disabled={disabled}
        checked={selectedOptions.taxonTags.includes(value)}
        onChange={() => onTaxonTagChange(value)}
      />
      <span>{label}</span>
      {showInfoIcon && infoIconTooltipContent && (
        <Tooltip title={infoIconTooltipContent} placement="top" arrow>
          <span>
            <Icon
              sdsIcon="infoCircle"
              sdsSize="xs"
              sdsType="static"
              color="gray"
              shade={500}
              className={cs.infoIcon}
            />
          </span>
        </Tooltip>
      )}
    </div>
  );
};
