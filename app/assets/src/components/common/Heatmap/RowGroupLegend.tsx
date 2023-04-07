// This component was designed for showing the genus of a group of species
// in the heatmap on hover, because genus is not always in the name of a species.
// The code was adapted from MetadataLegend.
import cx from "classnames";
import React from "react";
import { TooltipLocation } from "~/interface/shared";
import cs from "./row_group_legend.scss";

interface RowGroupLegendProps {
  tooltipLocation: TooltipLocation;
  label: string;
}

const RowGroupLegend = ({ tooltipLocation, label }: RowGroupLegendProps) => {
  return (
    <div
      className={cx(cs.tooltip)}
      style={{
        transform: "translate(-50%)",
        left: tooltipLocation.left + 4, // offset because of right-alignment of labels
        top: tooltipLocation.top - 44, // depends on heights defined in CSS
      }}>
      <div className={cs.legend}>{label}</div>
      <div className={cs.arrow} />
    </div>
  );
};

export default RowGroupLegend;
