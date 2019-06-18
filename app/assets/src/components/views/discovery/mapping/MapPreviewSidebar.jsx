import cx from "classnames";
import {
  difference,
  find,
  isEmpty,
  merge,
  pick,
  union,
  upperFirst,
} from "lodash/fp";
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

import cs from "./map_preview_sidebar.scss";

export default class MapPreviewSidebar extends React.Component {
  constructor(props) {
    super(props);

    const { initialSelectedSampleIds } = this.props;

    this.state = {
      selectedSampleIds: initialSelectedSampleIds || new Set(),
    };

    this.sampleColumns = [
      {
        dataKey: "sample",
        flexGrow: 1,
        width: 150,
        cellRenderer: cellData => TableRenderers.renderSample(cellData, false),
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
    ];

    this.projectColumns = [
      {
        dataKey: "project",
        flexGrow: 1,
        width: 350,
        cellRenderer: ({ cellData }) =>
          TableRenderers.renderItemDetails(
            merge(
              { cellData },
              {
                nameRenderer: p => p.name,
                detailsRenderer: p => (
                  <div>
                    <span>{p.owner}</span>
                  </div>
                ),
                visibilityIconRenderer: p =>
                  p && p.public_access ? (
                    <PublicProjectIcon />
                  ) : (
                    <PrivateProjectIcon />
                  ),
              }
            )
          ),
        headerClassName: cs.projectHeader,
        sortFunction: p => (p.name || "").toLowerCase(),
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
  }

  handleLoadSampleRows = async () => {
    // TODO(jsheu): Add pagination on the endpoint and loading for long lists of samples
    const { samples } = this.props;
    return samples;
  };

  handleSelectRow = (value, checked) => {
    const { selectedSampleIds } = this.state;

    let newSelected = selectedSampleIds;
    if (checked) {
      newSelected.add(value);
    } else {
      newSelected.delete(value);
    }
    this.setSelectedSampleIds(newSelected);

    logAnalyticsEvent("MapPreviewSidebar_row_selected", {
      selectedSampleIds: newSelected.length,
    });
  };

  handleSampleRowClick = ({ event, rowData }) => {
    const { onSampleClicked, samples } = this.props;
    const sample = find({ id: rowData.id }, samples);
    onSampleClicked && onSampleClicked({ sample, currentEvent: event });
    logAnalyticsEvent("MapPreviewSidebar_sample-row_clicked", {
      sampleId: sample.id,
      sampleName: sample.name,
    });
  };

  handleProjectRowClick = ({ rowData }) => {
    const { onProjectSelected, projects } = this.props;
    const project = find({ id: rowData.id }, projects);
    onProjectSelected && onProjectSelected({ project });
    logAnalyticsEvent("MapPreviewSidebar_project-row_clicked", {
      projectId: project.id,
      projectName: project.name,
    });
  };

  isSelectAllChecked = () => {
    const { selectableIds } = this.props;
    const { selectedSampleIds } = this.state;
    return (
      !isEmpty(selectableIds) &&
      isEmpty(difference(selectableIds, Array.from(selectedSampleIds)))
    );
  };

  handleSelectAllRows = (value, checked) => {
    const { selectableIds } = this.props;
    const { selectedSampleIds } = this.state;
    let newSelected = new Set(
      checked
        ? union(selectedSampleIds, selectableIds)
        : difference(selectedSampleIds, selectableIds)
    );
    this.setSelectedSampleIds(newSelected);

    logAnalyticsEvent("MapPreviewSidebar_select-all-rows_clicked");
  };

  handleTabChange = tab => {
    const { onTabChange } = this.props;
    onTabChange && onTabChange(tab);
    logAnalyticsEvent("MapPreviewSidebar_tab_clicked", { tab });
  };

  setSelectedSampleIds = selectedSampleIds => {
    const { onSelectionUpdate } = this.props;
    this.setState({ selectedSampleIds });
    onSelectionUpdate && onSelectionUpdate(selectedSampleIds);
  };

  computeTabs = () => {
    const { discoveryCurrentTab: tab, projects, samples } = this.props;
    const count = (tab === "samples" ? samples : projects || []).length;
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
    this.infiniteTable && this.infiniteTable.reset();
  };

  renderTable = () => {
    const { selectedSampleIds } = this.state;

    const rowHeight = 60;
    const batchSize = 1e4;
    const selectAllChecked = this.isSelectAllChecked();
    return (
      <div className={cs.container}>
        <div className={cs.table}>
          <InfiniteTable
            columns={this.sampleColumns}
            defaultRowHeight={rowHeight}
            initialActiveColumns={["sample"]}
            minimumBatchSize={batchSize}
            onLoadRows={this.handleLoadSampleRows}
            onRowClick={this.handleSampleRowClick}
            onSelectAllRows={this.handleSelectAllRows}
            onSelectRow={this.handleSelectRow}
            protectedColumns={["sample"]}
            ref={infiniteTable => (this.infiniteTable = infiniteTable)}
            rowClassName={cs.tableDataRow}
            rowCount={batchSize}
            selectableKey="id"
            selectAllChecked={selectAllChecked}
            selected={selectedSampleIds}
            threshold={batchSize}
          />
        </div>
      </div>
    );
  };

  renderNoData = () => {
    return (
      <div className={cs.noData}>Select a location to preview samples.</div>
    );
  };

  renderSummaryTab = () => {
    const {
      allowedFeatures,
      discoveryCurrentTab,
      loading,
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
        projectDimensions={projectDimensions}
        projectStats={projectStats}
        sampleDimensions={sampleDimensions}
        sampleStats={sampleStats}
      />
    );
  };

  renderSamplesTab = () => {
    const { samples } = this.props;
    return samples.length === 0 ? this.renderNoData() : this.renderTable();
  };

  renderProjectsTab = () => {
    const { projects } = this.props;
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
      <BaseDiscoveryView
        columns={this.projectColumns}
        initialActiveColumns={["project", "number_of_samples"]}
        protectedColumns={["project"]}
        data={data}
        handleRowClick={this.handleProjectRowClick}
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
  initialSelectedSampleIds: PropTypes.instanceOf(Set),
  loading: PropTypes.bool,
  onProjectSelected: PropTypes.func,
  onSampleClicked: PropTypes.func,
  onSelectionUpdate: PropTypes.func,
  onTabChange: PropTypes.func,
  projectDimensions: PropTypes.array,
  projectStats: PropTypes.object,
  projects: PropTypes.array,
  sampleDimensions: PropTypes.array,
  samples: PropTypes.array,
  sampleStats: PropTypes.object,
  selectableIds: PropTypes.array.isRequired,
};
