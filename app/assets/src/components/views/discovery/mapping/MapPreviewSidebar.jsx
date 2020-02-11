import cx from "classnames";
import { difference, isEmpty, merge, pick, union, upperFirst } from "lodash/fp";
import React from "react";

import { logAnalyticsEvent } from "~/api/analytics";
import Tabs from "~/components/ui/controls/Tabs";
import PropTypes from "~/components/utils/propTypes";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import DiscoverySidebar from "~/components/views/discovery/DiscoverySidebar";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import { ObjectCollectionView } from "../DiscoveryDataLayer";

import csTableRenderer from "~/components/views/discovery/table_renderers.scss";
import cs from "./map_preview_sidebar.scss";

const NCOV_PUBLIC_SITE = true;

export default class MapPreviewSidebar extends React.Component {
  constructor(props) {
    super(props);

    this.sampleColumns = [
      {
        dataKey: "sample",
        flexGrow: 1,
        width: 150,
        cellRenderer: cellData => TableRenderers.renderSample(cellData, false),
        className: cs.sample,
        headerClassName: cs.sampleHeader,
      },
      {
        dataKey: "createdAt",
        label: "Uploaded On",
        className: cs.basicCell,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "host",
        flexGrow: 1,
        className: cs.basicCell,
      },
      // If you already have access to Maps, just see Location V2 here.
      {
        dataKey: "collectionLocationV2",
        label: "Location",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "totalReads",
        label: "Total Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatNumberWithCommas(rowData[dataKey]),
      },
      {
        dataKey: "nonHostReads",
        label: "Passed Filters",
        flexGrow: 1,
        className: cs.basicCell,
        cellRenderer: TableRenderers.renderNumberAndPercentage,
      },
      {
        dataKey: "qcPercent",
        label: "Passed QC",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatPercentage(rowData[dataKey]),
      },
      {
        dataKey: "duplicateCompressionRatio",
        label: "DCR",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatPercentage(rowData[dataKey]),
      },
      {
        dataKey: "erccReads",
        label: "ERCC Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatNumberWithCommas(rowData[dataKey]),
      },
      {
        dataKey: "notes",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "nucleotideType",
        label: "Nucleotide Type",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "sampleType",
        label: "Sample Type",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "subsampledFraction",
        label: "SubSampled Fraction",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatNumber(rowData[dataKey]),
      },
      {
        dataKey: "totalRuntime",
        label: "Total Runtime",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatDuration(rowData[dataKey]),
      },
      {
        dataKey: "meanInsertSize",
        label: "Mean Insert Size",
        flexGrow: 1,
        className: cs.basicCell,
      },
    ];

    this.projectColumns = [
      {
        dataKey: "project",
        flexGrow: 1,
        width: 350,
        cellRenderer: ({ cellData }) => {
          return TableRenderers.renderItemDetails(
            merge(
              { cellData },
              {
                nameRenderer: p => (p ? p.name : ""),
                detailsRenderer: p => (
                  <div>
                    <span>{p ? p.owner : ""}</span>
                  </div>
                ),
                visibilityIconRenderer: p =>
                  p ? (
                    p.public_access ? (
                      <PublicProjectIcon />
                    ) : (
                      <PrivateProjectIcon />
                    )
                  ) : (
                    ""
                  ),
              }
            )
          );
        },
        headerClassName: cs.projectHeader,
        className: cs.project,
        sortKey: p => ((p && p.name) || "").toLowerCase(),
      },
      {
        dataKey: "created_at",
        label: "Created On",
        width: 100,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "hosts",
        width: 100,
        disableSort: true,
        cellRenderer: TableRenderers.renderList,
      },
      {
        dataKey: "tissues",
        width: 100,
        disableSort: true,
        cellRenderer: TableRenderers.renderList,
      },
      {
        dataKey: "number_of_samples",
        width: 100,
        label: "No. of Samples",
      },
    ];

    // refs to components for reset
    this.samplesTable = null;
    this.projectsTable = null;
  }

  componentDidUpdate = prevProps => {
    if (
      this.props.samples !== prevProps.samples ||
      this.props.projects !== prevProps.projects
    ) {
      this.reset();
    }
  };

  handleSelectRow = (value, checked) => {
    const { selectedSampleIds, onSelectionUpdate } = this.props;
    let newSelected = new Set(selectedSampleIds);
    if (checked) {
      newSelected.add(value);
    } else {
      newSelected.delete(value);
    }
    onSelectionUpdate(newSelected);
    logAnalyticsEvent("MapPreviewSidebar_row_selected", {
      selectedSampleIds: newSelected.size,
    });
  };

  handleSampleRowClick = ({ event, rowData }) => {
    const { onSampleClicked, samples } = this.props;
    const sample = samples.get(rowData.id);
    onSampleClicked && onSampleClicked({ sample, currentEvent: event });
    logAnalyticsEvent("MapPreviewSidebar_sample-row_clicked", {
      sampleId: sample.id,
      sampleName: sample.name,
    });
  };

  handleProjectRowClick = ({ rowData }) => {
    const { onProjectSelected, projects } = this.props;
    const project = projects.get(rowData.id);
    onProjectSelected && onProjectSelected({ project });
    logAnalyticsEvent("MapPreviewSidebar_project-row_clicked", {
      projectId: project.id,
      projectName: project.name,
    });
  };

  isSelectAllChecked = () => {
    const { samples, selectedSampleIds } = this.props;
    return (
      !isEmpty(samples.getIds()) &&
      isEmpty(difference(samples.getIds(), Array.from(selectedSampleIds)))
    );
  };

  handleSelectAllRows = checked => {
    const { samples, selectedSampleIds, onSelectionUpdate } = this.props;
    let newSelected = new Set(
      checked
        ? union(Array.from(selectedSampleIds), samples.getIds())
        : difference(Array.from(selectedSampleIds), samples.getIds())
    );
    onSelectionUpdate(newSelected);

    logAnalyticsEvent("MapPreviewSidebar_select-all-rows_clicked");
  };

  handleTabChange = tab => {
    const { onTabChange } = this.props;
    onTabChange && onTabChange(tab);
    logAnalyticsEvent("MapPreviewSidebar_tab_clicked", { tab });
  };

  computeTabs = () => {
    const { discoveryCurrentTab: tab, projectStats, sampleStats } = this.props;
    const count = tab === "samples" ? sampleStats.count : projectStats.count;
    return [
      {
        label: <span className={cs.tabLabel}>Summary</span>,
        value: "summary",
      },
      {
        label: (
          <div>
            <span className={cs.tabLabel}>{upperFirst(tab)}</span>
            {count > 0 && <span className={cs.tabCounter}>{count}</span>}
          </div>
        ),
        value: tab,
      },
    ];
  };

  reset = () => {
    this.samplesTable && this.samplesTable.reset();
    this.projectsTable && this.projectsTable.reset();
  };

  renderSamplesTab = () => {
    const { samples, selectedSampleIds } = this.props;

    const rowHeight = 60;
    const selectAllChecked = this.isSelectAllChecked();
    return (
      <div className={cs.container}>
        <div className={cs.table}>
          <InfiniteTable
            columns={this.sampleColumns}
            defaultRowHeight={rowHeight}
            headerClassName={cs.tableHeader}
            initialActiveColumns={["sample"]}
            loadingClassName={csTableRenderer.loading}
            onLoadRows={samples.handleLoadObjectRows}
            onRowClick={this.handleSampleRowClick}
            onSelectAllRows={this.handleSelectAllRows}
            onSelectRow={this.handleSelectRow}
            protectedColumns={["sample"]}
            ref={samplesTable => {
              this.samplesTable = samplesTable;
            }}
            rowClassName={cs.sampleRow}
            selectableColumnClassName={cs.selectColumn}
            selectableKey={!NCOV_PUBLIC_SITE ? "id" : undefined}
            selectAllChecked={selectAllChecked}
            selected={selectedSampleIds}
          />
        </div>
      </div>
    );
  };

  renderSummaryTab = () => {
    const {
      allowedFeatures,
      discoveryCurrentTab,
      loading,
      onFilterClick,
      projectDimensions,
      projectStats,
      sampleDimensions,
      sampleStats,
    } = this.props;

    return (
      <DiscoverySidebar
        allowedFeatures={allowedFeatures}
        className={cs.summaryInfo}
        currentTab={discoveryCurrentTab}
        loading={loading}
        onFilterClick={onFilterClick}
        projectDimensions={projectDimensions}
        projectStats={projectStats}
        sampleDimensions={sampleDimensions}
        sampleStats={sampleStats}
      />
    );
  };

  handleLoadRowsAndFormat = async args => {
    const { projects } = this.props;
    const loadedProjects = await projects.handleLoadObjectRows(args);

    return loadedProjects.map(project => {
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

  renderProjectsTab = () => {
    return (
      <BaseDiscoveryView
        columns={this.projectColumns}
        handleRowClick={this.handleProjectRowClick}
        initialActiveColumns={["project", "number_of_samples"]}
        protectedColumns={["project"]}
        headerClassName={cs.tableHeader}
        onLoadRows={this.handleLoadRowsAndFormat}
        ref={projectsTable => {
          this.projectsTable = projectsTable;
        }}
        rowClassName={cs.projectRow}
        rowHeight={50}
      />
    );
  };

  renderTabContent = tab => {
    switch (tab) {
      case "samples":
        return this.renderSamplesTab();
      case "projects":
        return this.renderProjectsTab();
      default:
        return this.renderSummaryTab();
    }
  };

  render() {
    const { className, currentTab } = this.props;
    return (
      <div className={cx(className, cs.sidebar)}>
        <Tabs
          className={cs.tabs}
          hideBorder
          onChange={this.handleTabChange}
          tabs={this.computeTabs()}
          value={currentTab}
        />
        {this.renderTabContent(currentTab)}
      </div>
    );
  }
}

MapPreviewSidebar.defaultProps = {
  currentTab: "summary",
};

MapPreviewSidebar.propTypes = {
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
  currentTab: PropTypes.string,
  discoveryCurrentTab: PropTypes.string,
  loading: PropTypes.bool,
  onFilterClick: PropTypes.func,
  onProjectSelected: PropTypes.func,
  onSampleClicked: PropTypes.func,
  onSelectionUpdate: PropTypes.func.isRequired,
  onTabChange: PropTypes.func,
  projectDimensions: PropTypes.array,
  projects: PropTypes.instanceOf(ObjectCollectionView),
  projectStats: PropTypes.object,
  sampleDimensions: PropTypes.array,
  samples: PropTypes.instanceOf(ObjectCollectionView),
  sampleStats: PropTypes.object,
  selectedSampleIds: PropTypes.instanceOf(Set),
};
