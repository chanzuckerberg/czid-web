import React from "react";
import PropTypes from "prop-types";
import { merge, pick } from "lodash";
import moment from "moment";

import { Table } from "~/components/visualizations/table";
import { humanize } from "~/helpers/strings";
import BasicPopup from "~/components/BasicPopup";
import { openUrl } from "~utils/links";

import cs from "./visualizations_view.scss";
import HeatmapPublic from "~ui/icons/HeatmapPublic";
import HeatmapPrivate from "~ui/icons/HeatmapPrivate";
import PhyloTreePublic from "~ui/icons/PhyloTreePublic";
import PhyloTreePrivate from "~ui/icons/PhyloTreePrivate";

// See also ProjectsView which is very similar
class VisualizationsView extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "icon",
        width: 36,
        label: "",
        cellRenderer: this.renderAccess
      },
      {
        dataKey: "details",
        label: "Visualization",
        flexGrow: 1,
        className: cs.detailsCell,
        cellRenderer: this.renderVisualizationDetails,
        headerClassName: cs.detailsHeader,
        sortFunction: p => p.updated_at
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

  renderAccess = ({ cellData: visualization }) => {
    if (visualization.visualization_type == "heatmap") {
      return (
        <div>
          {visualization.publicAccess ? (
            <HeatmapPublic className={cs.icon} />
          ) : (
            <HeatmapPrivate className={cs.icon} />
          )}
        </div>
      );
    } else if (visualization.visualization_type == "phylo_tree") {
      return (
        <div>
          {visualization.publicAccess ? (
            <PhyloTreePublic className={cs.icon} />
          ) : (
            <PhyloTreePrivate className={cs.icon} />
          )}
        </div>
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unknown visualization type: ${visualization.type}`);
    }
  };

  renderVisualizationDetails = ({ cellData: visualization }) => {
    const href = `/visualizations/${visualization.visualization_type}/${
      visualization.id
    }`;
    const visualizationTitle = visualization.name || humanize(visualization.visualization_type);
    return (
      <div className={cs.visualization}>
        <div className={cs.visualizationName}>
          <BasicPopup
            trigger={<a href={href}>{visualizationTitle}</a>}
            content={visualizationTitle}
          />
        </div>
        <div className={cs.visualizationDetails}>
          <span className={cs.visualizationCreationDate}>
            {moment(visualization.updated_at).fromNow()}
          </span>|
          <span className={cs.visualizationOwner}>
            {visualization.user_name}
          </span>
        </div>
      </div>
    );
  };

  handleRowClick = ({ event, index, rowData }) => {
    const url = `/visualizations/${rowData.visualization_type}/${rowData.id}`;
    openUrl(url, event);
  };

  render() {
    const { visualizations } = this.props;

    // Pick multiple keys for one column
    let data = visualizations.map(visualization => {
      return merge(
        {
          details: pick(visualization, [
            "user_name",
            "visualization_type",
            "updated_at",
            "id",
            "name",
            "publicAccess"
          ]),
          icon: pick(visualization, ["visualization_type", "publicAccess"])
        },
        visualization
      );
    });

    return (
      <Table
        sortable
        data={data}
        columns={this.columns}
        defaultRowHeight={80}
        sortBy={"visualization"}
        onRowClick={this.handleRowClick}
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
