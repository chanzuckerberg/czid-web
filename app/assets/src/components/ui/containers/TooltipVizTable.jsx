import React from "react";
import PropTypes from "prop-types";
import { get } from "lodash/fp";
import cx from "classnames";

import cs from "./tooltip_viz_table.scss";

class TooltipVizTable extends React.Component {
  renderLabel(label, compact) {
    return <div className={cx(cs.label, compact && cs.compact)}>{label}</div>;
  }

  renderValue(value) {
    return (
      <div className={cs.value}>
        {/* // Use .name if value is an object (e.g. location object) */}
        {get("name", value) || value}
      </div>
    );
  }

  renderSection(name, data, disabled, compact) {
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
                {this.renderLabel(datum[0], compact)}
                {this.renderValue(datum[1])}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  renderSections(data) {
    const compact = data.length === 1;
    return data.map(section =>
      this.renderSection(section.name, section.data, section.disabled, compact)
    );
  }

  render() {
    const { title, subtitle, data } = this.props;

    return (
      <div className={cs.table}>
        {title && <div className={cs.title}>{title}</div>}
        {subtitle && <div className={cs.subtitle}>{subtitle}</div>}
        {this.renderSections(data)}
      </div>
    );
  }
}

TooltipVizTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      // Array of key-value pairs
      data: PropTypes.arrayOf(PropTypes.array),
      disabled: PropTypes.bool,
    })
  ),
};

export default TooltipVizTable;
