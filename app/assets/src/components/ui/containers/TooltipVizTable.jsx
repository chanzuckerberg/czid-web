import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import cs from "./tooltip_viz_table.scss";

class TooltipDVTable extends React.Component {
  renderLabels(data, compact) {
    return (
      <div className={cs.labelColumn}>
        {data.map(keyValuePair => {
          return (
            <div
              className={cx(cs.label, compact && cs.compact)}
              key={`label-${keyValuePair}`}
            >
              {keyValuePair[0]}
            </div>
          );
        })}
      </div>
    );
  }

  renderValues(data) {
    return (
      <div className={cs.valueColumn}>
        {data.map(keyValuePair => {
          return (
            <div className={cs.value} key={`value-${keyValuePair}`}>
              {keyValuePair[1]}
            </div>
          );
        })}
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
          {this.renderLabels(data, compact)}
          {this.renderValues(data)}
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

TooltipDVTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      // Array of key-value pairs
      data: PropTypes.arrayOf(PropTypes.array),
      disabled: PropTypes.bool,
    })
  ),
};

export default TooltipDVTable;
