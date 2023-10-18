import { Icon, InputCheckbox, Tooltip } from "@czi-sds/components";
import { cx } from "@emotion/css";
import React from "react";
import { SelectedOptions } from "~/interface/shared";
import heatmap_filters_cs from "../../samples_heatmap_filters.scss";
import cs from "./samples_heatmap_taxon_tag_checkbox.scss";

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
    <div className={cs.checkboxContainer}>
      <InputCheckbox
        disabled={disabled}
        checked={selectedOptions.taxonTags.includes(value)}
        onChange={() => onTaxonTagChange(value)}
        className={cs.checkbox}
      />
      <span className={disabled ? cx(cs.label, cs.labelDisabled) : cs.label}>
        {label}
      </span>
      {showInfoIcon && infoIconTooltipContent && (
        <Tooltip title={infoIconTooltipContent} placement="top" arrow>
          <span>
            <Icon
              sdsIcon="infoCircle"
              sdsSize="xs"
              sdsType="static"
              color="gray"
              shade={500}
              className={heatmap_filters_cs.infoIcon}
            />
          </span>
        </Tooltip>
      )}
    </div>
  );
};
