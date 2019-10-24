// This component was designed for showing the genus of a group of species
// in the heatmap on hover, because genus is not always in the name of a species.
// The code was adapted from MetadataLegend.
import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { getTooltipStyle } from "~/components/utils/tooltip";

// TODO (gdingle): fix me
import cs from "./metadata_legend.scss";

export default class MetadataLegend extends React.Component {
  render() {
    const { tooltipLocation } = this.props;
    return (
      <div
        className={cx(cs.tooltip, cs.visible)}
        style={getTooltipStyle(tooltipLocation, {
          buffer: 20,
          below: false,
        })}
      >
        <div className={cs.legend}>
          <div className={cs.legendRow}>{this.props.label}</div>
        </div>
      </div>
    );
  }
}

MetadataLegend.propTypes = {
  tooltipLocation: PropTypes.object,
  label: PropTypes.string,
};
