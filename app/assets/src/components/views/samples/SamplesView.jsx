import cx from "classnames";
import { sortBy, difference, isEmpty, union } from "lodash/fp";
import React from "react";

import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import { showBulkDownloadNotification } from "~/components/views/bulk_download/BulkDownloadNotification";
import BulkDownloadModal from "~/components/views/bulk_download/BulkDownloadModal";
import CollectionModal from "~/components/views/samples/CollectionModal";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
import DownloadIcon from "~ui/icons/DownloadIcon";
import HeatmapIcon from "~ui/icons/HeatmapIcon";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import Label from "~ui/labels/Label";
import MapToggle from "~/components/views/discovery/mapping/MapToggle";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import PhyloTreeIcon from "~ui/icons/PhyloTreeIcon";
import PropTypes from "~/components/utils/propTypes";
import ReportsDownloader from "~/components/views/samples/ReportsDownloader";
import SaveIcon from "~ui/icons/SaveIcon";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { DownloadIconDropdown } from "~ui/controls/dropdowns";
import { getURLParamString } from "~/helpers/url";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import { ObjectCollectionView } from "../discovery/DiscoveryDataLayer";
import { UserContext } from "~/components/common/UserContext";

import ToolbarIcon from "./ToolbarIcon";
import { SAMPLE_TABLE_COLUMNS_V2 } from "./constants";
import cs from "./samples_view.scss";
import csTableRenderer from "../discovery/table_renderers.scss";

const NCOV_PUBLIC_SITE = true;

const NCOV_SAMPLE_ORDER = [
  "Index Case",
  "Index Case, resequenced",
  "Index Case, enriched",
  "Family Member 1",
  "Family Member 2",
  "Family Member 3",
  "Water Control 1",
  "Water Control 2",
  "Water Control 3",
  "Water Control 4",
];

const sortPublicNcovSamples = sampleRows =>
  sortBy(
    row =>
      NCOV_SAMPLE_ORDER.includes(row.sample.name)
        ? NCOV_SAMPLE_ORDER.indexOf(row.sample.name)
        : 100,
    sampleRows
  );

class SamplesView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      phyloTreeCreationModalOpen: false,
      bulkDownloadModalOpen: false,
      // This tooltip is reset whenever the selectedSampleIds changes.
      bulkDownloadButtonTempTooltip: null,
    };

    this.columns = [
      {
        dataKey: "sample",
        flexGrow: 1,
        width: 350,
        cellRenderer: TableRenderers.renderSample,
        headerClassName: cs.sampleHeader,
      },
      {
        dataKey: "createdAt",
        label: "Uploaded On",
        width: 120,
        className: cs.basicCell,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "host",
        flexGrow: 1,
        className: cs.basicCell,
      },
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
          TableRenderers.formatNumber(rowData[dataKey]),
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
        dataKey: "waterControl",
        label: "Water Control",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        dataKey: "meanInsertSize",
        label: "Mean Insert Size",
        flexGrow: 1,
        className: cs.basicCell,
      },
    ];

    for (let column of this.columns) {
      column["columnData"] = SAMPLE_TABLE_COLUMNS_V2[column["dataKey"]];
    }
  }

  componentDidUpdate(prevProps) {
    // Reset the tooltip whenever the selected samples changes.
    if (this.props.selectedSampleIds !== prevProps.selectedSampleIds) {
      this.setState({
        bulkDownloadButtonTempTooltip: null,
      });
    }
  }

  handleSelectRow = (value, checked) => {
    const { selectedSampleIds, onSelectedSamplesUpdate } = this.props;
    let newSelected = new Set(selectedSampleIds);
    if (checked) {
      newSelected.add(value);
    } else {
      newSelected.delete(value);
    }
    onSelectedSamplesUpdate(newSelected);
    logAnalyticsEvent("SamplesView_row_selected", {
      selectedSampleIds: newSelected.size,
    });
  };

  handleSelectAllRows = checked => {
    const {
      selectableIds,
      selectedSampleIds,
      onSelectedSamplesUpdate,
    } = this.props;
    let newSelected = new Set(
      checked
        ? union(Array.from(selectedSampleIds), selectableIds)
        : difference(Array.from(selectedSampleIds), selectableIds)
    );
    onSelectedSamplesUpdate(newSelected);
  };

  isSelectAllChecked = () => {
    const { selectableIds, selectedSampleIds } = this.props;
    return (
      !isEmpty(selectableIds) &&
      isEmpty(difference(selectableIds, Array.from(selectedSampleIds)))
    );
  };

  reset = () => {
    const { currentDisplay } = this.props;
    if (currentDisplay === "table") this.infiniteTable.reset();
  };

  renderHeatmapTrigger = () => {
    const { selectedSampleIds } = this.props;

    const heatmapOptions = [
      { text: "Taxon Heatmap", value: "/visualizations/heatmap" },
      { text: "AMR Heatmap", value: "/amr_heatmap" },
    ];

    const heatmapIcon = <HeatmapIcon className={cs.icon} />;

    return selectedSampleIds.size < 2 ? (
      <ToolbarIcon
        className={cx(cs.action, cs.heatmap)}
        disabled
        icon={heatmapIcon}
        popupText="Heatmap"
        popupSubtitle="Select at least 2 samples"
      />
    ) : (
      <BareDropdown
        hideArrow
        className={cx(cs.action)}
        items={heatmapOptions.map(option => {
          const params = getURLParamString({
            sampleIds: Array.from(selectedSampleIds),
          });
          const log = () =>
            logAnalyticsEvent("SamplesView_heatmap-option_clicked", {
              option,
              selectedSampleIds: selectedSampleIds.size,
            });
          return (
            <BareDropdown.Item
              key={option.text}
              text={<a href={`${option.value}?${params}`}>{option.text}</a>}
              onClick={log}
            />
          );
        })}
        trigger={
          <ToolbarIcon
            className={cs.heatmap}
            icon={heatmapIcon}
            popupText="Heatmap"
          />
        }
      />
    );
  };

  renderPhyloTreeTrigger = () => {
    const phyloTreeIcon = (
      <PhyloTreeIcon className={cx(cs.icon, cs.phyloTree)} />
    );
    return (
      <ToolbarIcon
        className={cs.action}
        icon={phyloTreeIcon}
        popupText="Phylogenetic Tree"
        onClick={withAnalytics(
          this.handlePhyloModalOpen,
          "SamplesView_phylo-tree-modal-open_clicked"
        )}
      />
    );
  };

  renderDownloadTrigger = () => {
    const { projectId, selectedSampleIds } = this.props;

    const downloadOptions = [{ text: "Sample Table", value: "samples_table" }];
    if (projectId) {
      downloadOptions.push({
        text: "Sample Reports",
        value: "project_reports",
      });
    }
    if (this.props.admin) {
      downloadOptions.push({
        text: "Host Gene Counts",
        value: "host_gene_counts",
      });
    }
    return (
      <DownloadIconDropdown
        className={cs.action}
        iconClassName={cx(cs.icon, cs.download)}
        options={downloadOptions}
        onClick={downloadOption => {
          new ReportsDownloader({
            projectId,
            downloadOption,
            selectedSampleIds,
          });
          logAnalyticsEvent("SamplesView_download-dropdown-option_clicked", {
            projectId,
            selectedSamplesCount: selectedSampleIds.size,
            downloadOption,
          });
        }}
      />
    );
  };

  renderBulkDownloadTrigger = () => {
    const { selectedSampleIds } = this.props;
    const { bulkDownloadButtonTempTooltip } = this.state;
    const downloadIcon = <DownloadIcon className={cx(cs.icon, cs.download)} />;
    return (
      <ToolbarIcon
        className={cs.action}
        icon={downloadIcon}
        popperDependencies={[bulkDownloadButtonTempTooltip]}
        popupText={bulkDownloadButtonTempTooltip || "Download"}
        disabled={selectedSampleIds.size === 0}
        onClick={withAnalytics(
          this.handleBulkDownloadModalOpen,
          "SamplesView_bulk-download-modal-open_clicked"
        )}
      />
    );
  };

  renderCollectionTrigger = () => {
    const { samples, selectedSampleIds } = this.props;

    const targetSamples = samples.loaded;

    const saveIcon = <SaveIcon className={cs.icon} />;

    return selectedSampleIds.size < 2 ? (
      <ToolbarIcon
        className={cs.action}
        disabled
        icon={saveIcon}
        popupText={"Background Model"}
        popupSubtitle="Select at least 2 samples"
      />
    ) : (
      <CollectionModal
        trigger={
          <ToolbarIcon
            className={cs.action}
            icon={saveIcon}
            popupText={"Background Model"}
          />
        }
        selectedSampleIds={selectedSampleIds}
        fetchedSamples={targetSamples.filter(sample =>
          selectedSampleIds.has(sample.id)
        )}
      />
    );
  };

  renderToolbar = () => {
    const { selectedSampleIds, allowedFeatures } = this.props;
    return (
      <div className={cs.samplesToolbar}>
        {this.renderDisplaySwitcher()}
        {NCOV_PUBLIC_SITE && (
          <div className={cs.instructions}>
            Click on a sample below to see how the reads from that sample
            matched to various organisms.
          </div>
        )}
        {!NCOV_PUBLIC_SITE && (
          <React.Fragment>
            <div className={cs.fluidBlank} />
            <div className={cs.counterContainer}>
              <Label
                circular
                className={cs.counter}
                // Log this no-op so we know if users want a way to view their selected samples
                onClick={() =>
                  logAnalyticsEvent(`SamplesView_sample-counter_clicked`)
                }
                text={`${selectedSampleIds.size}`}
              />
              <span className={cs.label}>Selected</span>
            </div>
            <div className={cs.separator} />
            <div className={cs.actions}>
              {this.renderCollectionTrigger()}
              {this.renderHeatmapTrigger()}
              {this.renderPhyloTreeTrigger()}
              {allowedFeatures.includes("bulk_downloads")
                ? this.renderBulkDownloadTrigger()
                : this.renderDownloadTrigger()}
            </div>
          </React.Fragment>
        )}
      </div>
    );
  };

  renderTable = () => {
    const {
      activeColumns,
      onActiveColumnsChange,
      onLoadRows,
      protectedColumns,
      selectedSampleIds,
    } = this.props;

    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 66;
    const selectAllChecked = this.isSelectAllChecked();
    return (
      <div className={cs.table}>
        <InfiniteTable
          ref={infiniteTable => (this.infiniteTable = infiniteTable)}
          columns={this.columns}
          defaultRowHeight={rowHeight}
          initialActiveColumns={activeColumns}
          loadingClassName={csTableRenderer.loading}
          onActiveColumnsChange={onActiveColumnsChange}
          onLoadRows={onLoadRows}
          onSelectAllRows={withAnalytics(
            this.handleSelectAllRows,
            "SamplesView_select-all-rows_clicked"
          )}
          onSelectRow={this.handleSelectRow}
          onRowClick={this.handleRowClick}
          protectedColumns={protectedColumns}
          rowClassName={cs.tableDataRow}
          selectableKey={!NCOV_PUBLIC_SITE ? "id" : undefined}
          selected={selectedSampleIds}
          selectAllChecked={selectAllChecked}
          selectableCellClassName={cs.selectableCell}
          customSampleSortFn={sortPublicNcovSamples}
        />
      </div>
    );
  };

  renderDisplaySwitcher = () => {
    const { currentDisplay, onDisplaySwitch } = this.props;
    return (
      <MapToggle
        currentDisplay={currentDisplay}
        onDisplaySwitch={display => {
          onDisplaySwitch(display);
          logAnalyticsEvent(`SamplesView_${display}-switch_clicked`);
        }}
      />
    );
  };

  renderMap = () => {
    const {
      currentTab,
      mapLevel,
      mapLocationData,
      mapPreviewedLocationId,
      mapTilerKey,
      onClearFilters,
      onMapLevelChange,
      onMapClick,
      onMapMarkerClick,
      onMapTooltipTitleClick,
    } = this.props;

    return (
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
    );
  };

  handlePhyloModalOpen = () => {
    this.setState({ phyloTreeCreationModalOpen: true });
  };

  handlePhyloModalClose = () => {
    this.setState({ phyloTreeCreationModalOpen: false });
  };

  handleBulkDownloadModalOpen = () => {
    const { appConfig, admin } = this.context || {};
    if (!appConfig.maxSamplesBulkDownload) {
      this.setState({
        bulkDownloadButtonTempTooltip:
          "Unexpected issue. Please contact us for help.",
      });
    } else if (
      this.props.selectedSampleIds.size > appConfig.maxSamplesBulkDownload &&
      !admin
    ) {
      // There is a separate max sample limit for the original input file download type.
      // This is checked in BulkDownloadModal, and the original input file option is disabled if there
      // are too many samples.
      this.setState({
        bulkDownloadButtonTempTooltip: `No more than ${
          appConfig.maxSamplesBulkDownload
        } samples allowed in one download.`,
      });
    } else {
      this.setState({ bulkDownloadModalOpen: true });
    }
  };

  handleBulkDownloadModalClose = () => {
    this.setState({ bulkDownloadModalOpen: false });
  };

  handleBulkDownloadGenerate = () => {
    this.handleBulkDownloadModalClose();
    showBulkDownloadNotification();
  };

  handleRowClick = ({ event, rowData }) => {
    const { onSampleSelected, samples } = this.props;
    const sample = samples.get(rowData.id);
    onSampleSelected && onSampleSelected({ sample, currentEvent: event });
    logAnalyticsEvent("SamplesView_row_clicked", {
      sampleId: sample.id,
      sampleName: sample.name,
    });
  };

  render() {
    const { currentDisplay, allowedFeatures, selectedSampleIds } = this.props;
    const { phyloTreeCreationModalOpen, bulkDownloadModalOpen } = this.state;
    return (
      <div className={cs.container}>
        {currentDisplay === "table" ? (
          this.renderToolbar()
        ) : (
          <NarrowContainer>{this.renderToolbar()}</NarrowContainer>
        )}
        {currentDisplay === "table" ? this.renderTable() : this.renderMap()}
        {phyloTreeCreationModalOpen && (
          <PhyloTreeCreationModal
            // TODO(tiago): migrate phylo tree to use api (or read csrf from context) and remove this
            csrf={document.getElementsByName("csrf-token")[0].content}
            onClose={withAnalytics(
              this.handlePhyloModalClose,
              "SamplesView_phylo-tree-modal_closed"
            )}
          />
        )}
        {allowedFeatures.includes("bulk_downloads") &&
          bulkDownloadModalOpen && (
            <BulkDownloadModal
              open
              onClose={withAnalytics(
                this.handleBulkDownloadModalClose,
                "SamplesView_bulk-download-modal_closed"
              )}
              selectedSampleIds={selectedSampleIds}
              onGenerate={this.handleBulkDownloadGenerate}
            />
          )}
      </div>
    );
  }
}

SamplesView.defaultProps = {
  activeColumns: [
    "sample",
    "createdAt",
    "host",
    "collectionLocationV2",
    "nonHostReads",
    "qcPercent",
  ],
  protectedColumns: ["sample"],
  currentDisplay: "table",
};

SamplesView.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string),
  admin: PropTypes.bool,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  currentDisplay: PropTypes.string.isRequired,
  currentTab: PropTypes.string.isRequired,
  mapLevel: PropTypes.string,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  mapPreviewedLocationId: PropTypes.number,
  mapTilerKey: PropTypes.string,
  onClearFilters: PropTypes.func,
  onActiveColumnsChange: PropTypes.func,
  onDisplaySwitch: PropTypes.func,
  onLoadRows: PropTypes.func.isRequired,
  onMapClick: PropTypes.func,
  onMapLevelChange: PropTypes.func,
  onMapMarkerClick: PropTypes.func,
  onMapTooltipTitleClick: PropTypes.func,
  onSampleSelected: PropTypes.func,
  onSelectedSamplesUpdate: PropTypes.func,
  projectId: PropTypes.number,
  protectedColumns: PropTypes.array,
  samples: PropTypes.instanceOf(ObjectCollectionView),
  selectableIds: PropTypes.array.isRequired,
  selectedSampleIds: PropTypes.instanceOf(Set),
};

SamplesView.contextType = UserContext;

export default SamplesView;
