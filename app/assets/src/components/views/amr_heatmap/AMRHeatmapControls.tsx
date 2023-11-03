import cx from "classnames";
import React from "react";
import { Divider } from "~/components/layout";
import SequentialLegendVis from "~/components/visualizations/legends/SequentialLegendVis";
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (option !== selectedOptions[control]) {
      onSelectedOptionsChange({ [control]: option });
    }
  };

  const renderControlDropdowns = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return controls.map(control => {
      return (
        <div className={cs.filterControl} key={control.key}>
          <Dropdown
            fluid
            rounded
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            options={control.options}
            onChange={(option: $TSFixMe) =>
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
              handleOptionChange(control.key, option)
            }
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
            value={selectedOptions[control.key]}
            label={control.label}
            disabled={!isDataReady}
          />
        </div>
      );
    });
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
