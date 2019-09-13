import React from "react";
import { merge, pick } from "lodash/fp";

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
import { ObjectCollectionView } from "../discovery/DiscoveryDataLayer";

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
                descriptionRenderer: this.descriptionRenderer,
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
    return <div className={cs.projectName}>{project ? project.name : ""}</div>;
  }

  visibilityIconRenderer(project) {
    return project && project.public_access ? (
      <PublicProjectIcon />
    ) : (
      <PrivateProjectIcon />
    );
  }

  descriptionRenderer(project) {
    return (
      <div className={cs.projectDescription}>
        {project ? project.description : ""}
      </div>
    );
  }

  detailsRenderer(project) {
    return (
      <div>
        <span>{project ? project.owner : ""}</span>
      </div>
    );
  }

  // Projects with descriptions should be displayed in taller rows,
  // otherwise use the default row height.
  getRowHeight = ({ row }) => {
    return row && row.project && row.project.description
      ? MAX_PROJECT_ROW_HEIGHT
      : DEFAULT_ROW_HEIGHT;
  };

  handleRowClick = ({ rowData }) => {
    console.log("ProjectsView:handleRowClick", rowData, onProjectSelected);
    const { onProjectSelected, projects } = this.props;
    const project = projects.get(rowData.id);
    console.log("ProjectsView:handleRowClick", project);
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

  handleLoadRowsAndFormat = async args => {
    const { onLoadRows } = this.props;
    const projects = await onLoadRows(args);

    return projects.map(project => {
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
    } = this.props;

    return (
      <div className={cs.container}>
        {this.renderDisplaySwitcher()}
        {currentDisplay === "table" ? (
          <BaseDiscoveryView
            columns={this.columns}
            handleRowClick={this.handleRowClick}
            onLoadRows={this.handleLoadRowsAndFormat}
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
  onLoadRows: PropTypes.func.isRequired,
  onMapClick: PropTypes.func,
  onMapLevelChange: PropTypes.func,
  onMapMarkerClick: PropTypes.func,
  onMapTooltipTitleClick: PropTypes.func,
  onProjectSelected: PropTypes.func,
  projects: PropTypes.instanceOf(ObjectCollectionView),
};

export default ProjectsView;
