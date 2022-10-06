import cx from "classnames";
import React from "react";

import { Divider } from "~/components/layout";
import SequentialLegendVis from "~/components/visualizations/legends/SequentialLegendVis.jsx";
import { Dropdown } from "~ui/controls/dropdowns";

import cs from "./amr_heatmap_view.scss";

interface AMRHeatmapControlsProps {
  controls?: {
    key?: string;
    options?: {
      text?: string;
      value?: string;
    }[];
    label?: string;
  }[];
  selectedOptions?: {
    metric?: string;
    viewLevel?: string;
    scale?: string;
  };
  onSelectedOptionsChange: $TSFixMeFunction;
  isDataReady?: boolean;
  maxValueForLegend?: number;
}

const AMRHeatmapControls = ({
  selectedOptions,
  onSelectedOptionsChange,
  controls,
  isDataReady,
  maxValueForLegend,
}: AMRHeatmapControlsProps) => {
  const handleOptionChange = (control: string, option: $TSFixMe) => {
    if (option !== selectedOptions[control]) {
      onSelectedOptionsChange({ [control]: option });
    }
  };

  const renderControlDropdowns = () => {
    const controlsList = controls.map(control => {
      return (
        <div className={cs.filterControl} key={control.key}>
          <Dropdown
            fluid
            rounded
            options={control.options}
            onChange={(option: $TSFixMe) =>
              handleOptionChange(control.key, option)
            }
            value={selectedOptions[control.key]}
            label={control.label}
            disabled={!isDataReady}
          />
        </div>
      );
    });
    return controlsList;
  };

  const renderLegend = () => {
    // Don't render a color legend if the heatmap is still loading
    if (!isDataReady) {
      return;
    }
    return (
      <div className={cs.filterControl} key="SequentialLegendVis">
        <SequentialLegendVis
          min={0}
          max={maxValueForLegend}
          scale={selectedOptions.scale}
        />
      </div>
    );
  };

  return (
    <div className={cs.menu}>
      <Divider />
      <div className={cx(cs.filterRow, "row")}>
        {renderControlDropdowns()}
        {renderLegend()}
      </div>
      <Divider />
    </div>
  );
};

export default AMRHeatmapControls;
