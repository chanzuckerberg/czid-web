import React from "react";
import PropTypes from "prop-types";
import { merge, pick } from "lodash/fp";

import { humanize } from "~/helpers/strings";
import { openUrl } from "~utils/links";
import HeatmapPublic from "~ui/icons/HeatmapPublic";
import HeatmapPrivate from "~ui/icons/HeatmapPrivate";
import PhyloTreePublic from "~ui/icons/PhyloTreePublic";
import PhyloTreePrivate from "~ui/icons/PhyloTreePrivate";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import TableRenderers from "~/components/views/discovery/TableRenderers";
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
                visibilityIconRenderer: this.visibilityIconRenderer
              }
            )
          ),
        headerClassName: cs.visualizationHeader,
        sortFunction: p => p.updated_at
      },
      {
        dataKey: "updated_at",
        label: "Updated On",
        width: 120,
        cellRenderer: TableRenderers.renderDate
      },
      {
        dataKey: "project_name",
        width: 280, // big enough for "mBAL-PLASMA and Medical Detectives"
        label: "Project"
      },
      {
        dataKey: "samples_count",
        width: 140,
        label: "Samples"
      }
    ];
  }

  nameRenderer(visualization) {
    return visualization.name || humanize(visualization.visualization_type);
  }

  visibilityIconRenderer = visualization => {
    const {
      visualization_type: visualizationType,
      publicAccess
    } = visualization;
    if (visualizationType == "heatmap") {
      return publicAccess ? (
        <HeatmapPublic className={cs.icon} />
      ) : (
        <HeatmapPrivate className={cs.icon} />
      );
    } else if (visualizationType == "phylo_tree") {
      publicAccess ? (
        <PhyloTreePublic className={cs.icon} />
      ) : (
        <PhyloTreePrivate className={cs.icon} />
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unknown visualization type: ${visualizationType}`);
    }
  };

  detailsRenderer(visualization) {
    return (
      <div>
        <span>{visualization.user_name}</span>
      </div>
    );
  }

  handleRowClick = ({ rowData }) => {
    const url = `/visualizations/${rowData.visualization.visualization_type}/${
      rowData.id
    }`;
    openUrl(url, event);
  };

  render() {
    const { visualizations } = this.props;
    let data = visualizations.map(visualization => {
      return merge(
        {
          visualization: pick(
            ["user_name", "visualization_type", "name", "publicAccess"],
            visualization
          )
        },
        pick(
          ["id", "updated_at", "project_name", "samples_count"],
          visualization
        )
      );
    });

    return (
      <BaseDiscoveryView
        columns={this.columns}
        data={data}
        handleRowClick={this.handleRowClick}
      />
    );
  }
}

VisualizationsView.defaultProps = {
  visualizations: []
};

VisualizationsView.propTypes = {
  visualizations: PropTypes.array
};

export default VisualizationsView;
