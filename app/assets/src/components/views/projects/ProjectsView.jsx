import React from "react";
import { find, merge, pick } from "lodash/fp";

import { logAnalyticsEvent } from "~/api/analytics";
import PropTypes from "~/components/utils/propTypes";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
import MapToggle from "~/components/views/discovery/mapping/MapToggle";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";

// CSS file must be loaded after any elements you might want to override
import cs from "./projects_view.scss";

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
                visibilityIconRenderer: this.visibilityIconRenderer,
              }
            )
          ),
        headerClassName: cs.projectHeader,
        sortFunction: p => (p.name || "").toLowerCase(),
      },
      {
        dataKey: "created_at",
        label: "Created On",
        width: 120,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "hosts",
        width: 200,
        disableSort: true,
        cellRenderer: TableRenderers.renderList,
      },
      {
        dataKey: "tissues",
        width: 200,
        disableSort: true,
        cellRenderer: TableRenderers.renderList,
      },
      {
        dataKey: "number_of_samples",
        width: 140,
        label: "No. of Samples",
      },
    ];
  }

  nameRenderer(project) {
    return project.name;
  }

  visibilityIconRenderer(project) {
    return project && project.public_access ? (
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
    logAnalyticsEvent("ProjectsView_row_clicked", {
      projectId: project.id,
      projectName: project.name,
    });
  };

  renderDisplaySwitcher = () => {
    const { currentDisplay, onDisplaySwitch } = this.props;
    return (
      <div className={cs.toggleContainer}>
        <MapToggle
          currentDisplay={currentDisplay}
          onDisplaySwitch={display => {
            onDisplaySwitch(display);
            logAnalyticsEvent(`ProjectsView_${display}-switch_clicked`);
          }}
        />
      </div>
    );
  };

  render() {
    const {
      allowedFeatures,
      currentDisplay,
      currentTab,
      mapLocationData,
      mapTilerKey,
      projects,
    } = this.props;
    let data = projects.map(project => {
      return merge(
        {
          project: pick(
            ["name", "description", "owner", "public_access"],
            project
          ),
        },
        pick(
          ["id", "created_at", "hosts", "tissues", "number_of_samples"],
          project
        )
      );
    });

    return (
      <div className={cs.container}>
        {allowedFeatures &&
          allowedFeatures.includes("maps") &&
          this.renderDisplaySwitcher()}
        {currentDisplay === "table" ? (
          <BaseDiscoveryView
            columns={this.columns}
            data={data}
            handleRowClick={this.handleRowClick}
          />
        ) : (
          <div className={cs.map}>
            <DiscoveryMap
              currentTab={currentTab}
              mapLocationData={mapLocationData}
              mapTilerKey={mapTilerKey}
              // onMarkerClick={onMapMarkerClick}
              // onTooltipTitleClick={onMapTooltipTitleClick}
              // previewedLocationId={mapPreviewedLocationId}
            />
          </div>
        )}
      </div>
    );
  }
}

ProjectsView.defaultProps = {
  currentDisplay: "table",
  projects: [],
};

ProjectsView.propTypes = {
  allowedFeatures: PropTypes.array,
  currentDisplay: PropTypes.string.isRequired,
  currentTab: PropTypes.string.isRequired,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  mapTilerKey: PropTypes.string,
  onDisplaySwitch: PropTypes.func,
  onProjectSelected: PropTypes.func,
  projects: PropTypes.array,
};

export default ProjectsView;
