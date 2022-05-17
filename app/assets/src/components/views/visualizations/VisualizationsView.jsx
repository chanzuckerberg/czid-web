import { merge, pick } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";

import { trackEvent } from "~/api/analytics";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { humanize } from "~/helpers/strings";
import {
  IconHeatmapPrivate,
  IconHeatmapPublic,
  IconPhyloTreePrivate,
  IconPhyloTreePublic,
} from "~ui/icons";
import StatusLabel from "~ui/labels/StatusLabel";
import { openUrl } from "~utils/links";
import { ObjectCollectionView } from "../discovery/DiscoveryDataLayer";
import cs from "./visualizations_view.scss";

// Maps SFN execution statuses to classic frontend statuses
const STATUS_MAPPING = {
  CREATED: "CREATED",
  RUNNING: "RUNNING",
  SUCCEEDED: "COMPLETE",
  SUCCEEDED_WITH_ISSUE: "COMPLETE",
  FAILED: "FAILED",
};

const STATUS_TYPE = {
  CREATED: "default",
  RUNNING: "default",
  SUCCEEDED: "success",
  SUCCEEDED_WITH_ISSUE: "success",
  FAILED: "error",
};

// See also ProjectsView which is very similar
class VisualizationsView extends React.Component {
  constructor(props) {
    super(props);

    this.discoveryView = null;

    this.columns = [
      {
        dataKey: "visualization",
        flexGrow: 1,
        width: 350,
        cellRenderer: ({ cellData }) =>
          TableRenderers.renderVisualization(
            merge(
              { cellData },
              {
                nameRenderer: this.nameRenderer,
                detailsRenderer: this.detailsRenderer,
                statusRenderer: this.statusRenderer,
                visibilityIconRenderer: this.visibilityIconRenderer,
              },
            ),
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

  statusRenderer = visualization => {
    return (
      <div>
        {visualization && visualization.status && (
          <StatusLabel
            className={cs.sampleStatus}
            status={STATUS_MAPPING[visualization.status]}
            type={STATUS_TYPE[visualization.status]}
          />
        )}
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
    } else if (["phylo_tree", "phylo_tree_ng"].includes(visualizationType)) {
      return publicAccess ? (
        <IconPhyloTreePublic className={cs.icon} />
      ) : (
        <IconPhyloTreePrivate className={cs.icon} />
      );
    } else if (!["table", "tree"].includes(visualizationType)) {
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
    trackEvent("VisualizationsView_row_clicked", {
      visualizationType: rowData.visualization.visualization_type,
      visualizationId: rowData.id,
      url,
    });
  };

  handleLoadRowsAndFormat = async args => {
    const { onLoadRows } = this.props;
    const visualizationsArray = await onLoadRows(args);

    return visualizationsArray.map(visualization => {
      return merge(
        {
          visualization: pick(
            [
              "user_name",
              "visualization_type",
              "name",
              "publicAccess",
              "status",
            ],
            visualization,
          ),
        },
        pick(
          ["id", "updated_at", "project_name", "samples_count"],
          visualization,
        ),
      );
    });
  };

  handleSortColumn = ({ sortBy, sortDirection }) => {
    // Calls onSortColumn callback to fetch sorted data
    this.props.onSortColumn({ sortBy, sortDirection });
  };

  reset = () => {
    const { currentDisplay } = this.props;
    currentDisplay === "table" &&
      this.discoveryView &&
      this.discoveryView.reset();
  };

  render() {
    const { sortBy, sortDirection, sortable } = this.props;

    return (
      <BaseDiscoveryView
        columns={this.columns}
        handleRowClick={this.handleRowClick}
        onLoadRows={this.handleLoadRowsAndFormat}
        onSortColumn={this.handleSortColumn}
        ref={discoveryView => (this.discoveryView = discoveryView)}
        sortable={sortable}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    );
  }
}

VisualizationsView.propTypes = {
  currentDisplay: PropTypes.string.isRequired,
  visualizations: PropTypes.instanceOf(ObjectCollectionView).isRequired,
  onLoadRows: PropTypes.func.isRequired,
  onSortColumn: PropTypes.func,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string,
  sortable: PropTypes.bool,
};

export default VisualizationsView;
