import cx from "classnames";
import { getOr } from "lodash/fp";
import React from "react";
import { HistogramTooltipData } from "~/components/common/CoverageVizBottomSidebar";
import cs from "./tooltip_viz_table.scss";

interface TooltipVizTableProps {
  data?: HistogramTooltipData[];
  description?: string | React.ReactElement;
  subtitle?: string | React.ReactElement;
  title?: string | React.ReactElement;
}

const TooltipVizTable = ({
  data,
  description,
  subtitle,
  title,
}: TooltipVizTableProps) => {
  const shouldCompactLabel = data.length === 1;

  const renderLabel = label => {
    return (
      <div className={cx(cs.label, shouldCompactLabel && cs.compact)}>
        {label}
      </div>
    );
  };

  const renderValue = value => {
    return <div className={cs.value}>{getOr(value, "name", value)}</div>;
  };

  const renderSection = section => {
    const { name, data, disabled } = section;
    return (
      <div
        className={cx(cs.section, disabled && cs.disabled)}
        key={`section-${name}`}
      >
        <div className={cx(cs.name, disabled && cs.disabled)}>{name}</div>
        <div className={cs.data}>
          {data.map((datum, index) => {
            const [label, value] = datum;
            return (
              <div className={cs.dataRow} key={`section-${name}-row-${index}`}>
                {renderLabel(label)}
                {renderValue(value)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSections = () => {
    return data.map(section => renderSection(section));
  };

  return (
    <div className={cs.table}>
      {title && <div className={cs.title}>{title}</div>}
      {subtitle && <div className={cs.subtitle}>{subtitle}</div>}
      {renderSections()}
      {description && <div className={cs.description}>{description}</div>}
    </div>
  );
};

export default TooltipVizTable;
