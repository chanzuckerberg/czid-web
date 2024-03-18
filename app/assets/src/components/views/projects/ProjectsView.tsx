import { Button, Icon } from "@czi-sds/components";
import { merge, pick } from "lodash/fp";
import React from "react";
import { SortDirectionType } from "react-virtualized";
import { trackEventFromClassComponent } from "~/api/analytics";
import NarrowContainer from "~/components/layout/NarrowContainer";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import DiscoveryViewToggle from "~/components/views/discovery/DiscoveryViewToggle";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { GlobalContext } from "~/globalContext/reducer";
import { Project } from "~/interface/shared";
import { ObjectCollectionView } from "../discovery/DiscoveryDataLayer";
import { ProjectCountsType } from "../discovery/DiscoveryViewFC";
import {
  DEFAULT_ROW_HEIGHT,
  MAX_PROJECT_ROW_HEIGHT,
  PROJECT_TABLE_COLUMNS,
} from "./constants";
// CSS file must be loaded after any elements you might want to override
import cs from "./projects_view.scss";

interface ProjectsViewProps {
  workflowRunsProjectAggregates?: ProjectCountsType;
  currentDisplay: string;
  currentTab: string;
  filteredProjectCount?: number;
  hasAtLeastOneFilterApplied?: boolean;
  mapLevel?: string;
  mapLocationData?: Record<string, unknown>;
  mapPreviewedLocationId?: number;
  mapTilerKey?: string;
  onClearFilters?: $TSFixMeFunction;
  onDisplaySwitch?: $TSFixMeFunction;
  onLoadRows: $TSFixMeFunction;
  onMapClick?: $TSFixMeFunction;
  onMapLevelChange?: $TSFixMeFunction;
  onMapMarkerClick?: $TSFixMeFunction;
  onMapTooltipTitleClick?: $TSFixMeFunction;
  onProjectSelected?: $TSFixMeFunction;
  onSortColumn?: $TSFixMeFunction;
  projects: ObjectCollectionView<Project, string>;
  sortable?: boolean;
  sortBy?: string;
  sortDirection?: SortDirectionType;
  totalNumberOfProjects?: number;
}

class ProjectsView extends React.Component<ProjectsViewProps> {
  columns: $TSFixMe;
  discoveryView: $TSFixMe;
  static contextType = GlobalContext;
  constructor(props: ProjectsViewProps) {
    super(props);

    this.discoveryView = null;

    this.columns = [
      {
        dataKey: "project",
        flexGrow: 1,
        width: 350,
        cellRenderer: ({ cellData }: $TSFixMe) =>
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
        sortKey: (p: $TSFixMe) => (p.name || "").toLowerCase(),
      },
      {
        dataKey: "created_at",
        label: "Created On",
        width: 100,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "hosts",
        width: 200,
        cellRenderer: TableRenderers.renderList,
      },
      {
        dataKey: "tissues",
        // tissue type was later renamed to sample type globally
        label: "Sample Types",
        width: 200,
        cellRenderer: TableRenderers.renderList,
      },
      {
        dataKey: "sample_counts",
        label: "Counts",
        width: 180,
        cellDataGetter: ({ rowData }) => {
          return {
            projectId: rowData.id,
            ...rowData.sample_counts,
          };
        },
        cellRenderer: ({ cellData }) =>
          TableRenderers.renderSampleCounts({
            cellData,
            workflowRunsProjectAggregates:
              this.props.workflowRunsProjectAggregates,
          }),
      },
    ];

    for (const column of this.columns) {
      column["columnData"] = PROJECT_TABLE_COLUMNS[column["dataKey"]];
    }
  }

  nameRenderer(project: $TSFixMe) {
    return project ? project.name : "";
  }

  visibilityIconRenderer(project: $TSFixMe) {
    if (!project) {
      return <div className={cs.icon} />;
    }
    return project.public_access ? (
      <Icon sdsIcon="projectPublic" sdsSize="xl" sdsType="static" />
    ) : (
      <Icon sdsIcon="projectPrivate" sdsSize="xl" sdsType="static" />
    );
  }

  descriptionRenderer(project: $TSFixMe) {
    return (
      <div className={cs.projectDescription}>
        {project ? project.description : ""}
      </div>
    );
  }

  detailsRenderer(project: $TSFixMe) {
    return <div>{project ? project.owner : ""}</div>;
  }

  // Projects with descriptions should be displayed in taller rows,
  // otherwise use the default row height.
  getRowHeight = ({ row }: $TSFixMe) => {
    return row && row.project && row.project.description
      ? MAX_PROJECT_ROW_HEIGHT
      : DEFAULT_ROW_HEIGHT;
  };

  handleRowClick = ({ rowData }: $TSFixMe) => {
    const { onProjectSelected, projects } = this.props;
    const project = projects.get(rowData.id);
    onProjectSelected && onProjectSelected({ project });
  };

  renderFilteredCount = () => {
    const {
      filteredProjectCount,
      hasAtLeastOneFilterApplied,
      onClearFilters,
      totalNumberOfProjects,
    } = this.props;

    const description = hasAtLeastOneFilterApplied
      ? `${filteredProjectCount || 0} out of ${totalNumberOfProjects} projects`
      : `${totalNumberOfProjects} project${
          totalNumberOfProjects === 1 ? "" : "s"
        }`;
    return (
      <div className={cs.filteredCount} data-testid="project-count">
        {description}
        {hasAtLeastOneFilterApplied && (
          <Button
            sdsStyle="minimal"
            sdsType="secondary"
            onClick={onClearFilters}
            data-testid="clear-filters-button"
          >
            Clear Filters
          </Button>
        )}
      </div>
    );
  };

  renderDisplaySwitcher = () => {
    const { currentDisplay, onDisplaySwitch } = this.props;
    const { discoveryProjectIds } = this.context;
    const globalAnalyticsContext = {
      projectIds: discoveryProjectIds,
    };
    const renderContent = () => (
      <div className={cs.toggleContainer}>
        <DiscoveryViewToggle
          currentDisplay={currentDisplay}
          onDisplaySwitch={(display: $TSFixMe) => {
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
            onDisplaySwitch(display);
            trackEventFromClassComponent(
              globalAnalyticsContext,
              `ProjectsView_${display}-switch_clicked`,
            );
          }}
        />
      </div>
    );
    return currentDisplay === "table" ? (
      <>
        {renderContent()}
        {this.renderFilteredCount()}
      </>
    ) : (
      <NarrowContainer>
        {renderContent()}
        {this.renderFilteredCount()}
      </NarrowContainer>
    );
  };

  handleLoadRowsAndFormat = async (args: $TSFixMe) => {
    const { onLoadRows } = this.props;
    const projects = await onLoadRows(args);
    // @ts-expect-error Property 'map' does not exist on type 'unknown'.
    return projects.map((project: $TSFixMe) =>
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

  handleSortColumn = ({ sortBy, sortDirection }: $TSFixMe) => {
    // Calls onSortColumn callback to fetch sorted data
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    this.props.onSortColumn({ sortBy, sortDirection });
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
      sortBy,
      sortDirection,
      sortable,
    } = this.props;

    return (
      <div className={cs.container}>
        {this.renderDisplaySwitcher()}
        {currentDisplay === "table" ? (
          <BaseDiscoveryView
            columns={this.columns}
            handleRowClick={this.handleRowClick}
            onLoadRows={this.handleLoadRowsAndFormat}
            onSortColumn={this.handleSortColumn}
            ref={(discoveryView: $TSFixMe) =>
              (this.discoveryView = discoveryView)
            }
            rowHeight={this.getRowHeight}
            sortable={sortable}
            sortBy={sortBy}
            sortDirection={sortDirection}
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
ProjectsView.defaultProps = {
  currentDisplay: "table",
};

export default ProjectsView;
