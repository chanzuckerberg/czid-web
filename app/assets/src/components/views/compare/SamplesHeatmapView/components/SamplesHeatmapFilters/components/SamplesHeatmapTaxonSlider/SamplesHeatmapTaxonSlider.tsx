import { DropdownPopper, InputDropdown, InputSlider } from "czifui";
import React, { useState } from "react";
import cs from "./samples_heatmap_taxon_slider.scss";

interface SamplesHeatmapTaxonSliderPropsType {
  isDisabled: boolean;
  onChangeCommitted: (value: number) => void;
  min: number;
  max: number;
  value: number;
}

const marks = [
  {
    value: 0,
    label: "0",
  },
  {
    value: 50,
    label: "50",
  },
  {
    value: 100,
    label: "100",
  },
];

export const SamplesHeatmapTaxonSlider = ({
  isDisabled,
  onChangeCommitted,
  min,
  max,
  value,
}: SamplesHeatmapTaxonSliderPropsType) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDropdownInputClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  return (
    <>
      <InputDropdown
        disabled={isDisabled}
        onClick={handleDropdownInputClick}
        label={<div className={cs.label}>Taxa Per Sample</div>}
        sdsStyle="minimal"
        sdsStage="default"
        details={value.toString()}
      />
      <DropdownPopper
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        placement="bottom-start">
        <div className={cs.taxaPerSampleSliderContainer}>
          <InputSlider
            disabled={isDisabled}
            max={max}
            min={min}
            onChangeCommitted={(_event, value: number) =>
              onChangeCommitted(value)
            }
            marks={marks}
            value={value}
            valueLabelDisplay="on"
          />
        </div>
      </DropdownPopper>
    </>
  );
};
