import React from "react";
import PropTypes from "prop-types";
import { merge, pick } from "lodash";
import moment from "moment";
import cx from "classnames";

import { Table } from "~/components/visualizations/table";
import { humanize } from "~/helpers/strings";
import GlobeIcon from "~ui/icons/GlobeIcon";
import LockIcon from "~ui/icons/LockIcon";

import cs from "./visualizations_view.scss";

class VisualizationsView extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "public_access",
        width: 30,
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
        sortFunction: p => p.created_at
      }
    ];
  }

  renderAccess = ({ cellData: publicAccess }) => {
    return (
      <div>
        {publicAccess ? (
          <GlobeIcon className={cx(cs.icon, cs.iconGlobe)} />
        ) : (
          <LockIcon className={cx(cs.icon, cs.iconLock)} />
        )}
      </div>
    );
  };

  renderVisualizationDetails = ({ cellData: visualization }) => {
    const href = `/visualizations/${visualization.visualization_type}/${
      visualization.id
    }`;
    // TODO (gdingle): put name and project_name in own cols
    return (
      <div className={cs.visualization}>
        <div className={cs.visualizationName}>
          <a href={href}>
            {humanize(visualization.visualization_type)}
            {` "${visualization.name}" `}
            from {visualization.project_name} ({visualization.samples_count})
          </a>
        </div>
        <div className={cs.visualizationDetails}>
          <span className={cs.visualizationCreationDate}>
            {moment(visualization.created_at).fromNow()}
          </span>|
          <span className={cs.visualizationOwner}>
            {visualization.user_name}
          </span>
        </div>
      </div>
    );
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
            "created_at",
            "id",
            // TODO (gdingle): put name and project_name in own columns
            "name",
            "project_name",
            "samples_count"
          ])
        },
        visualization
      );
    });

    return (
      <Table
        sortable
        data={data}
        columns={this.columns}
        defaultRowHeight={120}
        sortBy={"visualization"}
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
