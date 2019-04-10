import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { Table } from "~/components/visualizations/table";
import PrivateProjectIcon from "../../ui/icons/PrivateProjectIcon";
import PublicProjectIcon from "../../ui/icons/PublicProjectIcon";
import BasicPopup from "~/components/BasicPopup";
// CSS file must be loaded after any elements you might want to override
import cs from "./projects_view.scss";

import { find, merge, pick } from "lodash/fp";
import moment from "moment";

class ProjectsView extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "project",
        flexGrow: 1,
        width: 250,
        cellRenderer: this.renderProjectDetails,
        headerClassName: cs.projectHeader,
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
        label: "No. of Samples"
      }
    ];
  }

  renderProjectDetails = ({ cellData: project }) => {
    return (
      <div className={cs.project}>
        <div className={cs.visibility}>
          {project && project.publicAccess ? (
            <PublicProjectIcon className={cx(cs.icon, cs.iconPublic)} />
          ) : (
            <PrivateProjectIcon className={cx(cs.icon, cs.iconPrivate)} />
          )}
        </div>
        <div className={cs.projectRightPane}>
          <BasicPopup
            trigger={<div className={cs.projectName}>{project.name}</div>}
            content={project.name}
          />
          <div className={cs.projectDescription}>{project.description}</div>
          <div className={cs.projectDetails}>
            <span className={cs.projectCreationDate}>
              {moment(project.created_at).fromNow()}
            </span>|
            <span className={cs.projectOwner}>{project.owner}</span>
          </div>
        </div>
      </div>
    );
  };

  // TODO: move generic renderers to table component
  renderList = ({ cellData: list }) => {
    return list && list.length > 0 ? list.join(", ") : "N/A";
  };

  handleRowClick = ({ rowData }) => {
    const { onProjectSelected, projects } = this.props;
    const project = find({ id: rowData.id }, projects);
    onProjectSelected && onProjectSelected({ project });
  };

  render() {
    const { projects } = this.props;
    let data = projects.map(project => {
      return merge(
        {
          project: pick(
            ["name", "description", "created_at", "owner", "public_access"],
            project
          )
        },
        pick(["id", "hosts", "tissues", "number_of_samples"], project)
      );
    });

    return (
      <Table
        sortable
        data={data}
        columns={this.columns}
        defaultRowHeight={68}
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
