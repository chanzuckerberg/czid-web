import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { getTooltipStyle } from "~/components/utils/tooltip";

import cs from "./metadata_legend.scss";

export default class MetadataLegend extends React.Component {
  render() {
    const { columnMetadataLegend, tooltipLocation } = this.props;
    return (
      <div
        className={cx(cs.tooltip, columnMetadataLegend && cs.visible)}
        style={getTooltipStyle(tooltipLocation, {
          buffer: 20,
          below: true,
        })}
      >
        <div className={cs.legend}>
          {Object.keys(columnMetadataLegend)
            .sort()
            .map(label => (
              <div className={cs.legendRow} key={label}>
                <span
                  className={cs.legendEntryColor}
                  style={{ backgroundColor: columnMetadataLegend[label] }}
                />
                {label}
              </div>
            ))}
        </div>
      </div>
    );
  }
}

MetadataLegend.propTypes = {
  columnMetadataLegend: PropTypes.object,
  tooltipLocation: PropTypes.object,
};
