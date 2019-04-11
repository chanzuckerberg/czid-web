import React from "react";
import PropTypes from "prop-types";

import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import TableRenderers from "~/components/views/discovery/TableRenderers";
// CSS file must be loaded after any elements you might want to override
import cs from "./projects_view.scss";

import { find, merge, pick } from "lodash/fp";

class ProjectsView extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        dataKey: "project",
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
        headerClassName: cs.projectHeader,
        sortFunction: p => (p.name || "").toLowerCase()
      },
      {
        dataKey: "created_at",
        label: "Created On",
        width: 120,
        cellRenderer: TableRenderers.renderDateWithElapsed
      },
      {
        dataKey: "hosts",
        width: 200,
        disableSort: true,
        cellRenderer: TableRenderers.renderList
      },
      {
        dataKey: "tissues",
        width: 200,
        disableSort: true,
        cellRenderer: TableRenderers.renderList
      },
      {
        dataKey: "number_of_samples",
        width: 140,
        label: "No. of Samples!!"
      }
    ];
  }

  nameRenderer(project) {
    return project.name;
  }

  visibilityIconRenderer(project) {
    return project && project.publicAccess ? (
      <PublicProjectIcon />
    ) : (
      <PrivateProjectIcon />
    );
  }

  detailsRenderer(project) {
    return (
      <div>
        <span>{project.owner}</span>
      </div>
    );
  }

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
            ["name", "description", "owner", "public_access"],
            project
          )
        },
        pick(
          ["id", "created_at", "hosts", "tissues", "number_of_samples"],
          project
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

ProjectsView.defaultProps = {
  projects: []
};

ProjectsView.propTypes = {
  projects: PropTypes.array,
  onProjectSelected: PropTypes.func
};

export default ProjectsView;
