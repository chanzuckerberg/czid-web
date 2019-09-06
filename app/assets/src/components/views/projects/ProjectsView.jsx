import React from "react";
import { find, merge, pick } from "lodash/fp";

import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
import MapToggle from "~/components/views/discovery/mapping/MapToggle";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import PropTypes from "~/components/utils/propTypes";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { logAnalyticsEvent } from "~/api/analytics";
import { DEFAULT_ROW_HEIGHT, MAX_PROJECT_ROW_HEIGHT } from "./constants";

// CSS file must be loaded after any elements you might want to override
import cs from "./projects_view.scss";

class ProjectsView extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        columnData: {
          tooltip: "User-defined project name and author.",
        },
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
                descriptionRenderer: this.descriptionRenderer,
                visibilityIconRenderer: this.visibilityIconRenderer,
              }
            )
          ),
        headerClassName: cs.projectHeader,
        sortFunction: p => (p.name || "").toLowerCase(),
      },
      {
        columnData: {
          tooltip: "Date project was created in IDseq.",
        },
        dataKey: "created_at",
        label: "Created On",
        width: 120,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        columnData: {
          tooltip:
            "User-selected organism(s) from which the samples in the project were collected.",
        },
        dataKey: "hosts",
        width: 200,
        disableSort: true,
        cellRenderer: TableRenderers.renderList,
      },
      {
        columnData: {
          tooltip:
            "User-supplied metadata field indicating sample types in the project.",
        },
        dataKey: "tissues",
        width: 200,
        disableSort: true,
        cellRenderer: TableRenderers.renderList,
      },
      {
        columnData: {
          tooltip: "Total number of samples in the project.",
        },
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

  descriptionRenderer(project) {
    return project.description;
  }

  detailsRenderer(project) {
    return (
      <div>
        <span>{project.owner}</span>
      </div>
    );
  }

  // Projects with descriptions should be displayed in taller rows,
  // otherwise use the default row height.
  getRowHeight = ({ index }) => {
    const { projects } = this.props;
    const project = projects[index];
    return project.description ? MAX_PROJECT_ROW_HEIGHT : DEFAULT_ROW_HEIGHT;
  };

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
    const renderContent = () => (
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
    return currentDisplay === "table" ? (
      renderContent()
    ) : (
      <NarrowContainer>{renderContent()}</NarrowContainer>
    );
  };

  render() {
    const {
      currentDisplay,
      currentTab,
      mapLevel,
      mapLocationData,
      mapPreviewedLocationId,
      mapTilerKey,
      onClearFilters,
      onMapClick,
      onMapLevelChange,
      onMapMarkerClick,
      onMapTooltipTitleClick,
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
        {this.renderDisplaySwitcher()}
        {currentDisplay === "table" ? (
          <BaseDiscoveryView
            columns={this.columns}
            data={data}
            handleRowClick={this.handleRowClick}
            rowHeight={this.getRowHeight}
          />
        ) : (
          <div className={cs.map}>
            <DiscoveryMap
              currentTab={currentTab}
              mapLevel={mapLevel}
              mapLocationData={mapLocationData}
              mapTilerKey={mapTilerKey}
              onClearFilters={onClearFilters}
              onClick={onMapClick}
              onMapLevelChange={onMapLevelChange}
              onMarkerClick={onMapMarkerClick}
              onTooltipTitleClick={onMapTooltipTitleClick}
              previewedLocationId={mapPreviewedLocationId}
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
  mapLevel: PropTypes.string,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  mapPreviewedLocationId: PropTypes.number,
  mapTilerKey: PropTypes.string,
  onClearFilters: PropTypes.func,
  onDisplaySwitch: PropTypes.func,
  onMapClick: PropTypes.func,
  onMapLevelChange: PropTypes.func,
  onMapMarkerClick: PropTypes.func,
  onMapTooltipTitleClick: PropTypes.func,
  onProjectSelected: PropTypes.func,
  projects: PropTypes.array,
};

export default ProjectsView;
