import React from "react";
import PropTypes from "prop-types";
// TODO (gdingle):  refactor me?
import { Table } from "~/components/visualizations/table";
import { merge, pick } from "lodash";
import GlobeIcon from "~ui/icons/GlobeIcon";
import LockIcon from "~ui/icons/LockIcon";
import moment from "moment";
// TODO (gdingle): refactor
import cs from "./visualizations_view.scss";
import cx from "classnames";

// TODO (gdingle): refactor with ProjectsView?
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
      // {
      //   dataKey: "details",
      //   label: "Visualization",
      //   flexGrow: 1,
      //   className: cs.detailsCell,
      //   cellRenderer: this.renderVisualizationDetails,
      //   headerClassName: cs.detailsHeader,
      //   sortFunction: p => p.name
      // },
      {
        dataKey: "visualization_type",
        width: 200
      },
      {
        dataKey: "created_at",
        width: 200
      }
      // { dataKey: "number_of_samples", width: 140, label: "No. Of Samples" }
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

  renderVisualizationDetails = ({ cellData: Visualization }) => {
    return (
      <div className={cs.Visualization}>
        <div className={cs.VisualizationName}>{Visualization.name}</div>
        <div className={cs.VisualizationDescription}>
          {Visualization.description || "No description (DELETE THIS)"}
        </div>
        <div className={cs.VisualizationDetails}>
          <span className={cs.VisualizationCreationDate}>
            {moment(Visualization.created_at).fromNow()}
          </span>|
          <span className={cs.VisualizationOwner}>
            {Visualization.owner || "No owner (DELETE THIS)"}
          </span>
        </div>
      </div>
    );
  };

  // TODO: move generic renderers to table component
  renderList = ({ cellData: list }) => {
    return list && list.length > 0 ? list.join(", ") : "N/A";
  };

  render() {
    const { visualizations } = this.props;

    // let data = visualizations.map(visualization => {
    //   return merge(
    //     {
    //       details: pick(visualization, [
    //         "user",
    //         "visualization_type",
    //         "created_at",
    //       ])
    //     },
    //     pick(visualization, [
    //       "public_access",
    //       // TODO (gdingle): include samples?
    //     ])
    //   );
    // });

    return (
      <Table
        sortable
        data={visualizations}
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
