import React from "react";
import PropTypes from "prop-types";
import { Table } from "~/components/visualizations/table";
import { find, merge, pick } from "lodash/fp";
import moment from "moment";
import cs from "./projects_view.scss";
import cx from "classnames";
import PrivateProjectIcon from "../../ui/icons/PrivateProjectIcon";
import PublicProjectIcon from "../../ui/icons/PublicProjectIcon";

class ProjectsView extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "public_access",
        width: 36,
        label: "",
        cellRenderer: this.renderAccess
      },
      {
        dataKey: "details",
        label: "Project",
        flexGrow: 1,
        className: cs.detailsCell,
        cellRenderer: this.renderProjectDetails,
        headerClassName: cs.detailsHeader,
        sortFunction: p => (p.name || "").toLowerCase()
      },
      {
        dataKey: "hosts",
        width: 200,
        disableSort: true,
        cellRenderer: this.renderList
      },
      {
        dataKey: "tissues",
        width: 200,
        disableSort: true,
        cellRenderer: this.renderList
      },
      {
        dataKey: "number_of_samples",
        width: 140,
        label: "No. Of Samples",
        sortFunction: numSamples => {
          return numSamples;
        }
      }
    ];
  }

  renderAccess = ({ cellData: publicAccess }) => {
    return (
      <div>
        {publicAccess ? (
          <PublicProjectIcon className={cx(cs.icon, cs.iconPublic)} />
        ) : (
          <PrivateProjectIcon className={cx(cs.icon, cs.iconPrivate)} />
        )}
      </div>
    );
  };

  renderProjectDetails = ({ cellData: project }) => {
    return (
      <div className={cs.project}>
        <div className={cs.projectName}>{project.name}</div>
        <div className={cs.projectDescription}>{project.description}</div>
        <div className={cs.projectDetails}>
          <span className={cs.projectCreationDate}>
            {moment(project.created_at).fromNow()}
          </span>|
          <span className={cs.projectOwner}>{project.owner}</span>
        </div>
      </div>
    );
  };

  // TODO: move generic renderers to table component
  renderList = ({ cellData: list }) => {
    return list && list.length > 0 ? list.join(", ") : "N/A";
  };

  handleRowClick = ({ event, index, rowData }) => {
    const { onProjectSelected, projects } = this.props;
    const project = find({ id: rowData.id }, projects);
    onProjectSelected && onProjectSelected({ project });
  };

  render() {
    const { projects } = this.props;
    let data = projects.map(project => {
      return merge(
        {
          details: pick(["name", "description", "created_at", "owner"], project)
        },
        pick(
          ["id", "public_access", "hosts", "tissues", "number_of_samples"],
          project
        )
      );
    });

    return (
      <Table
        sortable
        data={data}
        columns={this.columns}
        defaultRowHeight={90}
        onRowClick={this.handleRowClick}
      />
    );
  }
}

ProjectsView.defaultProps = {
  projects: []
};

ProjectsView.propTypes = {
  projects: PropTypes.array,
  onProjectSelected: PropTypes.func
};

export default ProjectsView;
