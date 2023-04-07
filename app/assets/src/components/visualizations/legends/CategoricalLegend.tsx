import cx from "classnames";
import React from "react";
import cs from "./categorical_legend.scss";

interface CategoricalLegendProps {
  className?: string;
  data?: { label: string; color: string }[];
}

// This component takes in an array of objects, each having a color
// and label key, and renders a colored circle and the label text just
// to the right of it.
// Schema:
// this.props.data = [ { color: "#aeaeae", label: "Sample Label" } ]
const CategoricalLegend = ({ data, className }: CategoricalLegendProps) => {
  const renderCategories = () => {
    return data.map(item => {
      return (
        <div className={cs.category} key={`${item.color}+${item.label}`}>
          <svg className={cs.colorCircle}>
            <circle
              // Circle in the center of the viewBox
              cx="50%"
              cy="50%"
              fill={item.color}
            />
          </svg>
          <span className={cs.label}>{item.label}</span>
        </div>
      );
    });
  };

  return (
    <div className={cx(cs.legendContainer, className)}>
      {renderCategories()}
    </div>
  );
};

export default CategoricalLegend;
