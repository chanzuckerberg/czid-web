import { InputDropdown, InputSlider } from "@czi-sds/components";
import Popover from "@mui/material/Popover";
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
  const [inputValue, setInputValue] = useState<number>(value);

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
        sdsType="label"
        sdsStage="default"
        value={value.toString()}
      />
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <div className={cs.taxaPerSampleSliderContainer}>
          <InputSlider
            disabled={isDisabled}
            max={max}
            min={min}
            onChange={(_event, newInputValue: number) =>
              setInputValue(newInputValue)
            }
            onChangeCommitted={(_event, currentInputValue: number) =>
              onChangeCommitted(currentInputValue)
            }
            marks={marks}
            value={inputValue}
            valueLabelDisplay="on"
          />
        </div>
      </Popover>
    </>
  );
};
