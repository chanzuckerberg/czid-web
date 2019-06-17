import React from "react";
import PropTypes from "prop-types";

import { ViewHeader } from "~/components/layout";

import cs from "./amr_heatmap_view.scss";

export default class AMRHeatmapHeader extends React.Component {
  render() {
    const { sampleIds } = this.props;

    return (
      <ViewHeader className={cs.viewHeader}>
        <ViewHeader.Content>
          <ViewHeader.Pretitle>
            Antimicrobial Resistance Heatmap
          </ViewHeader.Pretitle>
          <ViewHeader.Title
            label={`Comparing ${sampleIds ? sampleIds.length : ""} Samples`}
          />
        </ViewHeader.Content>
      </ViewHeader>
    );
  }
}

AMRHeatmapHeader.propTypes = {
  sampleIds: PropTypes.arrayOf(PropTypes.number),
};
