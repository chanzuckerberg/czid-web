import { Icon } from "@czi-sds/components";
import cx from "classnames";
import {
  difference,
  forEach,
  isEmpty,
  merge,
  pick,
  union,
  upperFirst,
} from "lodash/fp";
import React from "react";
import Tabs from "~/components/ui/controls/Tabs";
import BaseDiscoveryView from "~/components/views/discovery/BaseDiscoveryView";
import DiscoverySidebar from "~/components/views/discovery/DiscoverySidebar";
import csTableRenderer from "~/components/views/discovery/table_renderers.scss";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import { DimensionsDetailed } from "~/interface/discoveryView";
import { PipelineTypeRun } from "~/interface/samplesView";
import { Project } from "~/interface/shared";
import { ObjectCollectionView } from "../DiscoveryDataLayer";
import cs from "./map_preview_sidebar.scss";

interface MapPreviewSidebarProps {
  allowedFeatures?: string[];
  className?: string;
  currentTab?: string;
  discoveryCurrentTab?: string;
  loading?: boolean;
  onFilterClick?: $TSFixMeFunction;
  onProjectSelected?: $TSFixMeFunction;
  onSampleClicked?: $TSFixMeFunction;
  onSelectionUpdate: (selectedIds: Set<string>) => void;
  onTabChange?: $TSFixMeFunction;
  projectDimensions?: DimensionsDetailed;
  projects?: ObjectCollectionView<Project, string>;
  projectStats?: object;
  sampleDimensions?: DimensionsDetailed;
  samples?: ObjectCollectionView<PipelineTypeRun, string>;
  sampleStats?: object;
  selectedSampleIds?: Set<string>;
}

export default class MapPreviewSidebar extends React.Component<MapPreviewSidebarProps> {
  projectColumns: $TSFixMe;
  projectsTable: $TSFixMe;
  referenceSelectId: $TSFixMe;
  sampleColumns: $TSFixMe;
  samplesTable: $TSFixMe;
  constructor(props: MapPreviewSidebarProps) {
    super(props);

    this.sampleColumns = [
      {
        dataKey: "sample",
        flexGrow: 1,
        width: 150,
        cellRenderer: ({ cellData }: $TSFixMe) =>
          TableRenderers.renderSample({ sample: cellData, full: false }),
        className: cs.sample,
        headerClassName: cs.sampleHeader,
      },
      {
        dataKey: "createdAt",
        label: "Created On",
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
        dataKey: "collection_location_v2",
        label: "Location",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "totalReads",
        label: "Total Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }: $TSFixMe) =>
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
        cellDataGetter: ({ dataKey, rowData }: $TSFixMe) =>
          TableRenderers.formatPercentage(rowData[dataKey]),
      },
      {
        dataKey: "duplicateCompressionRatio",
        label: "DCR",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }: $TSFixMe) =>
          TableRenderers.formatNumber(rowData[dataKey]),
      },
      {
        dataKey: "erccReads",
        label: "ERCC Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }: $TSFixMe) =>
          TableRenderers.formatNumberWithCommas(rowData[dataKey]),
      },
      {
        dataKey: "notes",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "nucleotide_type",
        label: "Nucleotide Type",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "sample_type",
        label: "Sample Type",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "subsampledFraction",
        label: "SubSampled Fraction",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }: $TSFixMe) =>
          TableRenderers.formatNumber(rowData[dataKey]),
      },
      {
        dataKey: "totalRuntime",
        label: "Total Runtime",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }: $TSFixMe) =>
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
        cellRenderer: ({ cellData }: $TSFixMe) => {
          return TableRenderers.renderItemDetails(
            // @ts-expect-error Property 'descriptionRenderer' is missing in type
            merge(
              { cellData },
              {
                nameRenderer: (p: $TSFixMe) => (p ? p.name : ""),
                detailsRenderer: (p: $TSFixMe) => (
                  <div>
                    <span>{p ? p.owner : ""}</span>
                  </div>
                ),
                visibilityIconRenderer: (p: $TSFixMe) =>
                  p ? (
                    p.public_access ? (
                      <Icon
                        sdsIcon="projectPublic"
                        sdsSize="xl"
                        sdsType="static"
                      />
                    ) : (
                      <Icon
                        sdsIcon="projectPrivate"
                        sdsSize="xl"
                        sdsType="static"
                      />
                    )
                  ) : (
                    ""
                  ),
              },
            ),
          );
        },
        headerClassName: cs.projectHeader,
        className: cs.project,
        sortKey: (p: $TSFixMe) => ((p && p.name) || "").toLowerCase(),
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

    this.referenceSelectId = null;
  }

  componentDidUpdate = (prevProps: $TSFixMe) => {
    if (
      this.props.samples !== prevProps.samples ||
      this.props.projects !== prevProps.projects
    ) {
      this.reset();
    }
  };

  handleSelectRow = (value: $TSFixMe, checked: $TSFixMe, event: $TSFixMe) => {
    const { samples, selectedSampleIds, onSelectionUpdate } = this.props;
    const { referenceSelectId } = this;

    const newSelected = new Set(selectedSampleIds);
    if (event.shiftKey && referenceSelectId) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      const ids = samples.getIntermediateIds({
        id1: referenceSelectId,
        id2: value,
      });
      if (checked) {
        forEach(v => {
          newSelected.add(v);
        }, ids);
      } else {
        forEach(v => {
          newSelected.delete(v);
        }, ids);
      }
    } else {
      if (checked) {
        newSelected.add(value);
      } else {
        newSelected.delete(value);
      }
    }
    this.referenceSelectId = value;

    onSelectionUpdate(newSelected);
  };

  handleSampleRowClick = ({ event, rowData }: $TSFixMe) => {
    const { onSampleClicked, samples } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const sample = samples.get(rowData.id);
    onSampleClicked && onSampleClicked({ object: sample, currentEvent: event });
  };

  handleProjectRowClick = ({ rowData }: $TSFixMe) => {
    const { onProjectSelected, projects } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const project = projects.get(rowData.id);
    onProjectSelected && onProjectSelected({ project });
  };

  isSelectAllChecked = () => {
    const { samples, selectedSampleIds } = this.props;
    return (
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      !isEmpty(samples.getIds()) &&
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
      isEmpty(difference(samples.getIds(), Array.from(selectedSampleIds)))
    );
  };

  handleSelectAllRows = (checked: $TSFixMe) => {
    const { samples, selectedSampleIds, onSelectionUpdate } = this.props;

    this.referenceSelectId = null;
    const newSelected = new Set(
      checked
        ? // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          union(Array.from(selectedSampleIds), samples.getIds())
        : // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          difference(Array.from(selectedSampleIds), samples.getIds()),
    );
    onSelectionUpdate(newSelected);
  };

  handleTabChange = (tab: $TSFixMe) => {
    const { onTabChange } = this.props;
    onTabChange && onTabChange(tab);
  };

  computeTabs = () => {
    const { discoveryCurrentTab: tab, projectStats, sampleStats } = this.props;
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    const count = tab === "samples" ? sampleStats.count : projectStats.count;
    return [
      {
        label: (
          <span data-testid="summary-tablabel" className={cs.tabLabel}>
            Summary
          </span>
        ),
        value: "summary",
      },
      {
        label: (
          <div>
            <span data-testid="sample-tablabel" className={cs.tabLabel}>
              {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345 */}
              {upperFirst(tab)}
            </span>
            {count > 0 && (
              <span data-testid="sample-count" className={cs.tabCounter}>
                {count}
              </span>
            )}
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
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            onLoadRows={samples.handleLoadObjectRows}
            onRowClick={this.handleSampleRowClick}
            onSelectAllRows={this.handleSelectAllRows}
            onSelectRow={this.handleSelectRow}
            protectedColumns={["sample"]}
            ref={(samplesTable: $TSFixMe) => {
              this.samplesTable = samplesTable;
            }}
            rowClassName={cs.sampleRow}
            selectableColumnClassName={cs.selectColumn}
            selectableKey="id"
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        currentTab={discoveryCurrentTab}
        loading={loading}
        onFilterClick={onFilterClick}
        noDataAvailable={false}
        projectDimensions={projectDimensions}
        projectStats={projectStats}
        sampleDimensions={sampleDimensions}
        sampleStats={sampleStats}
      />
    );
  };

  handleLoadRowsAndFormat = async (args: $TSFixMe) => {
    const { projects } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const loadedProjects = await projects.handleLoadObjectRows(args);

    return loadedProjects.map((project: $TSFixMe) => {
      return merge(
        {
          project: pick(
            ["name", "description", "owner", "public_access"],
            project,
          ),
        },
        pick(
          ["id", "created_at", "hosts", "tissues", "number_of_samples"],
          project,
        ),
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
        ref={(projectsTable: $TSFixMe) => {
          this.projectsTable = projectsTable;
        }}
        rowClassName={cs.projectRow}
        rowHeight={50}
      />
    );
  };

  renderTabContent = (tab: $TSFixMe) => {
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          tabs={this.computeTabs()}
          value={currentTab}
        />
        {this.renderTabContent(currentTab)}
      </div>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
MapPreviewSidebar.defaultProps = {
  currentTab: "summary",
};
