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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (selectedOptions.taxonTags.includes(value)) {
      onSelectedOptionsChange({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        taxonTags: selectedOptions.taxonTags.filter(tag => tag !== value),
      });
    } else {
      const taxonTags = selectedOptions.taxonTags || [];
      onSelectedOptionsChange({
        taxonTags: [...taxonTags, value],
      });
    }
  };

  return (
    <div className={cs.checkboxContainer}>
      <InputCheckbox
        disabled={disabled}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
