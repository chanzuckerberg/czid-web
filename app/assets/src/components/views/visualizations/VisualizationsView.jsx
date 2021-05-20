import { merge, pick } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";

import { logAnalyticsEvent } from "~/api/analytics";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { humanize } from "~/helpers/strings";
import {
  IconHeatmapPrivate,
  IconHeatmapPublic,
  IconPhyloTreePrivate,
  IconPhyloTreePublic,
} from "~ui/icons";
import { openUrl } from "~utils/links";
import { ObjectCollectionView } from "../discovery/DiscoveryDataLayer";
import cs from "./visualizations_view.scss";

// See also ProjectsView which is very similar
class VisualizationsView extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "visualization",
        flexGrow: 1,
        width: 350,
        cellRenderer: ({ cellData }) =>
          TableRenderers.renderItemDetails(
            merge(
              { cellData },
              {
                nameRenderer: this.nameRenderer,
                detailsRenderer: this.detailsRenderer,
                visibilityIconRenderer: this.visibilityIconRenderer,
              }
            )
          ),
        headerClassName: cs.visualizationHeader,
        sortKey: p => p && p.updated_at,
      },
      {
        dataKey: "updated_at",
        label: "Updated On",
        width: 120,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "project_name",
        width: 280, // big enough for "mBAL-PLASMA and Medical Detectives"
        label: "Project",
      },
      {
        dataKey: "samples_count",
        width: 140,
        label: "Samples",
      },
    ];
  }

  nameRenderer = visualization => {
    return (
      <div>
        {visualization
          ? visualization.name || humanize(visualization.visualization_type)
          : ""}
      </div>
    );
  };

  visibilityIconRenderer = visualization => {
    if (!visualization) return <div className={cs.icon} />;

    const {
      visualization_type: visualizationType,
      publicAccess,
    } = visualization;
    if (visualizationType === "heatmap") {
      return publicAccess ? (
        <IconHeatmapPublic className={cs.icon} />
      ) : (
        <IconHeatmapPrivate className={cs.icon} />
      );
    } else if (visualizationType === "phylo_tree") {
      return publicAccess ? (
        <IconPhyloTreePublic className={cs.icon} />
      ) : (
        <IconPhyloTreePrivate className={cs.icon} />
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unknown visualization type: ${visualizationType}`);
    }
  };

  detailsRenderer(visualization) {
    return <div>{visualization ? visualization.user_name : ""}</div>;
  }

  handleRowClick = ({ rowData }) => {
    const url = `/visualizations/${rowData.visualization.visualization_type}/${rowData.id}`;
    openUrl(url, event);
    logAnalyticsEvent("VisualizationsView_row_clicked", {
      visualizationType: rowData.visualization.visualization_type,
      visualizationId: rowData.id,
      url,
    });
  };

  handleLoadRowsAndFormat = async args => {
    const { visualizations } = this.props;
    const visualizationsArray = await visualizations.handleLoadObjectRows(args);

    return visualizationsArray.map(visualization => {
      return merge(
        {
          visualization: pick(
            ["user_name", "visualization_type", "name", "publicAccess"],
            visualization
          ),
        },
        pick(
          ["id", "updated_at", "project_name", "samples_count"],
          visualization
        )
      );
    });
  };

  render() {
    return (
      <BaseDiscoveryView
        columns={this.columns}
        handleRowClick={this.handleRowClick}
        onLoadRows={this.handleLoadRowsAndFormat}
      />
    );
  }
}

VisualizationsView.propTypes = {
  visualizations: PropTypes.instanceOf(ObjectCollectionView).isRequired,
};

export default VisualizationsView;
