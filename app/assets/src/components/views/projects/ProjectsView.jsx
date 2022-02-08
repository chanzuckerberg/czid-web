import { merge, pick } from "lodash/fp";
import React from "react";

import { logAnalyticsEvent } from "~/api/analytics";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "~/components/utils/propTypes";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import DiscoveryViewToggle from "~/components/views/discovery/DiscoveryViewToggle";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
import { IconProjectPrivate, IconProjectPublic } from "~ui/icons";
import { ObjectCollectionView } from "../discovery/DiscoveryDataLayer";
import {
  DEFAULT_ROW_HEIGHT,
  MAX_PROJECT_ROW_HEIGHT,
  PROJECT_TABLE_COLUMNS,
} from "./constants";

// CSS file must be loaded after any elements you might want to override
import cs from "./projects_view.scss";

class ProjectsView extends React.Component {
  constructor(props) {
    super(props);

    this.discoveryView = null;

    this.columns = [
      {
        dataKey: "project",
        flexGrow: 1,
        width: 350,
        disableSort: true,
        cellRenderer: ({ cellData }) =>
          TableRenderers.renderItemDetails(
            merge(
              { cellData },
              {
                nameRenderer: this.nameRenderer,
                detailsRenderer: this.detailsRenderer,
                descriptionRenderer: this.descriptionRenderer,
                visibilityIconRenderer: this.visibilityIconRenderer,
              },
            ),
          ),
        headerClassName: cs.projectHeader,
        sortKey: p => (p.name || "").toLowerCase(),
      },
      {
        dataKey: "created_at",
        label: "Created On",
        width: 120,
        disableSort: true,
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
        // tissue type was later renamed to sample type globally
        label: "Sample Types",
        width: 200,
        disableSort: true,
        cellRenderer: TableRenderers.renderList,
      },
      {
        dataKey: "sample_counts",
        label: "Counts",
        width: 140,
        disableSort: true,
        cellRenderer: TableRenderers.renderSampleCounts,
      },
    ];

    for (let column of this.columns) {
      column["columnData"] = PROJECT_TABLE_COLUMNS[column["dataKey"]];
    }
  }

  nameRenderer(project) {
    return project ? project.name : "";
  }

  visibilityIconRenderer(project) {
    if (!project) {
      return <div className={cs.icon} />;
    }
    return project.public_access ? (
      <IconProjectPublic />
    ) : (
      <IconProjectPrivate />
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
    return <div>{project ? project.owner : ""}</div>;
  }

  // Projects with descriptions should be displayed in taller rows,
  // otherwise use the default row height.
  getRowHeight = ({ row }) => {
    return row && row.project && row.project.description
      ? MAX_PROJECT_ROW_HEIGHT
      : DEFAULT_ROW_HEIGHT;
  };

  handleRowClick = ({ rowData }) => {
    const { onProjectSelected, projects } = this.props;
    const project = projects.get(rowData.id);
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
        <DiscoveryViewToggle
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

    return projects.map(project =>
      merge(
        {
          project: pick(
            ["name", "description", "owner", "public_access"],
            project,
          ),
        },
        pick(
          ["id", "created_at", "hosts", "tissues", "sample_counts"],
          project,
        ),
      ),
    );
  };

  reset = () => {
    const { currentDisplay } = this.props;
    currentDisplay === "table" &&
      this.discoveryView &&
      this.discoveryView.reset();
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
            ref={discoveryView => (this.discoveryView = discoveryView)}
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
  projects: PropTypes.instanceOf(ObjectCollectionView).isRequired,
};

export default ProjectsView;
