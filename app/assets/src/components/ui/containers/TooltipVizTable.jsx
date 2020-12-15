import React from "react";
import PropTypes from "prop-types";
import { getOr } from "lodash/fp";
import cx from "classnames";

import cs from "./tooltip_viz_table.scss";

const TooltipVizTable = ({ data, subtitle, title }) => {
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
    </div>
  );
};

TooltipVizTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      // Array of key-value pairs
      data: PropTypes.arrayOf(PropTypes.array),
      disabled: PropTypes.bool,
    })
  ),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

export default TooltipVizTable;
