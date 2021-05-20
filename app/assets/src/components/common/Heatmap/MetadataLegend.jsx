// *** This component is used on both the AMR and Taxon Heatmap. When
// the user hovers over a label for a metadata field, this component
// shows a tooltip legend for that particular field. ***

import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { getTooltipStyle } from "~/components/utils/tooltip";

import cs from "./metadata_legend.scss";

export default class MetadataLegend extends React.Component {
  render() {
    const { metadataColors, tooltipLocation } = this.props;
    return (
      <div
        className={cx(cs.tooltip, metadataColors && cs.visible)}
        style={getTooltipStyle(tooltipLocation, {
          buffer: 20,
          below: true,
        })}
      >
        <div className={cs.legend}>
          {Object.keys(metadataColors)
            .sort()
            .map(label => (
              <div className={cs.legendRow} key={label}>
                {metadataColors[label] && (
                  <span
                    className={cs.legendEntryColor}
                    style={{ backgroundColor: metadataColors[label] }}
                  />
                )}
                {label}
              </div>
            ))}
        </div>
      </div>
    );
  }
}

MetadataLegend.propTypes = {
  metadataColors: PropTypes.object, // A map containing metadata values and their color in the heatmap
  tooltipLocation: PropTypes.object,
};
