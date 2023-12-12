import cx from "classnames";
import { getOr } from "lodash/fp";
import React from "react";
import { TooltipData } from "~/components/common/CoverageVizBottomSidebar/types";
import cs from "./tooltip_viz_table.scss";

interface TooltipVizTableProps {
  data: TooltipData[];
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
  return (
    <div className={cs.table}>
      {title && <div className={cs.title}>{title}</div>}
      {subtitle && <div className={cs.subtitle}>{subtitle}</div>}
      {data.map(section => (
        <div
          className={cx(cs.section, section.disabled && cs.disabled)}
          key={`section-${section.name}`}
        >
          <div className={cx(cs.name, section.disabled && cs.disabled)}>
            {section.name}
          </div>
          <div className={cs.data}>
            {section.data.map((datum, index) => {
              const [label, value] = datum;
              return (
                <div
                  className={cs.dataRow}
                  key={`section-${section.name}-row-${index}`}
                >
                  <div
                    className={cx(cs.label, shouldCompactLabel && cs.compact)}
                  >
                    {label}
                  </div>
                  <div className={cs.value}>{getOr(value, "name", value)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {description && <div className={cs.description}>{description}</div>}
    </div>
  );
};

export default TooltipVizTable;
