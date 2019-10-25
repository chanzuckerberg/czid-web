// This component was designed for showing the genus of a group of species
// in the heatmap on hover, because genus is not always in the name of a species.
// The code was adapted from MetadataLegend.
import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import cs from "./row_group_legend.scss";

export default class MetadataLegend extends React.Component {
  render() {
    const { tooltipLocation } = this.props;
    return (
      <div
        className={cx(cs.tooltip)}
        style={{
          width: tooltipLocation.width,
          left: tooltipLocation.left + 4, // offset because of right-alignment of labels
          top: tooltipLocation.top - 44, // depends on heights defined in CSS
        }}
      >
        <div className={cs.legend}>{this.props.label}</div>
        <div className={cs.arrow} />
      </div>
    );
  }
}

MetadataLegend.propTypes = {
  tooltipLocation: PropTypes.object,
  label: PropTypes.string,
};
