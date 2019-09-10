import cx from "classnames";
import { difference, find, isEmpty, union } from "lodash/fp";
import React from "react";

import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import CollectionModal from "~/components/views/samples/CollectionModal";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
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
import { SAMPLE_TABLE_COLUMNS_V2 } from "./constants";

import cs from "./samples_view.scss";
import csTableRenderer from "../discovery/table_renderers.scss";

class SamplesView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      phyloTreeCreationModalOpen: false,
    };

    this.columns = [
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["sample"],
        dataKey: "sample",
        flexGrow: 1,
        width: 350,
        cellRenderer: TableRenderers.renderSample,
        headerClassName: cs.sampleHeader,
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["createdAt"],
        dataKey: "createdAt",
        label: "Uploaded On",
        width: 120,
        className: cs.basicCell,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["host"],
        dataKey: "host",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["collectionLocationV2"],
        dataKey: "collectionLocationV2",
        label: "Location",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["totalReads"],
        dataKey: "totalReads",
        label: "Total Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatNumberWithCommas(rowData[dataKey]),
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["nonHostReads"],
        dataKey: "nonHostReads",
        label: "Passed Filters",
        flexGrow: 1,
        className: cs.basicCell,
        cellRenderer: TableRenderers.renderNumberAndPercentage,
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["qcPercent"],
        dataKey: "qcPercent",
        label: "Passed QC",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatPercentage(rowData[dataKey]),
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["duplicateCompressionRatio"],
        dataKey: "duplicateCompressionRatio",
        label: "DCR",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatNumber(rowData[dataKey]),
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["erccReads"],
        dataKey: "erccReads",
        label: "ERCC Reads",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatNumberWithCommas(rowData[dataKey]),
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["notes"],
        dataKey: "notes",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["nucleotideType"],
        dataKey: "nucleotideType",
        label: "Nucleotide Type",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["sampleType"],
        dataKey: "sampleType",
        label: "Sample Type",
        flexGrow: 1,
        className: cs.basicCell,
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["subsampledFraction"],
        dataKey: "subsampledFraction",
        label: "SubSampled Fraction",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatNumber(rowData[dataKey]),
      },
      {
        columnData: SAMPLE_TABLE_COLUMNS_V2["totalRuntime"],
        dataKey: "totalRuntime",
        label: "Total Runtime",
        flexGrow: 1,
        className: cs.basicCell,
        cellDataGetter: ({ dataKey, rowData }) =>
          TableRenderers.formatDuration(rowData[dataKey]),
      },
    ];
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

    if (
      this.props.allowedFeatures.includes("amr_heatmap") ||
      this.props.admin
    ) {
      const heatmapOptions = [
        { text: "Taxon Heatmap", value: "/visualizations/heatmap" },
        { text: "AMR Heatmap", value: "/amr_heatmap" },
      ];

      return selectedSampleIds.size < 2 ? (
        <HeatmapIcon className={cx(cs.icon, cs.disabled, cs.heatmap)} />
      ) : (
        <BareDropdown
          hideArrow
          className={cx(cs.icon, cs.heatmapDropdown)}
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
          trigger={<HeatmapIcon className={cx(cs.icon, cs.heatmap)} />}
        />
      );
    } else {
      const log = () =>
        logAnalyticsEvent("SamplesView_heatmap-icon_clicked", {
          selectedSampleIds: selectedSampleIds.size,
        });
      return selectedSampleIds.size < 2 ? (
        <HeatmapIcon className={cx(cs.icon, cs.disabled, cs.heatmap)} />
      ) : (
        <a
          onClick={log}
          href={`/visualizations/heatmap?sampleIds=${Array.from(
            selectedSampleIds
          )}`}
        >
          <HeatmapIcon className={cx(cs.icon, cs.heatmap)} />
        </a>
      );
    }
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

  renderCollectionTrigger = () => {
    const {
      currentDisplay,
      mapPreviewedSamples,
      selectedSampleIds,
      samples,
    } = this.props;

    // NOTE(jsheu): For mapSidebar sample names to appear in CollectionModal,
    // they need to be presently loaded/fetched. Otherwise the ids work but says "and more..." for un-fetched samples.
    const targetSamples =
      currentDisplay === "map" ? mapPreviewedSamples : samples;
    return selectedSampleIds.size < 2 ? (
      <SaveIcon
        className={cx(cs.icon, cs.disabled, cs.save)}
        popupText={"Save a Collection"}
      />
    ) : (
      <CollectionModal
        trigger={
          <SaveIcon
            className={cx(cs.icon, cs.save)}
            popupText={"Save a Collection"}
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
    const { selectedSampleIds } = this.props;
    return (
      <div className={cs.samplesToolbar}>
        {this.renderDisplaySwitcher()}
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
          <div className={cs.action}>{this.renderCollectionTrigger()}</div>
          <div className={cs.action}>{this.renderHeatmapTrigger()}</div>
          <div
            className={cs.action}
            onClick={withAnalytics(
              this.handlePhyloModalOpen,
              "SamplesView_phylo-tree-modal-open_clicked"
            )}
          >
            <PhyloTreeIcon className={cs.icon} />
          </div>
          <div className={cs.action}>{this.renderDownloadTrigger()}</div>
        </div>
      </div>
    );
  };

  renderTable = () => {
    const {
      activeColumns,
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
          onLoadRows={onLoadRows}
          onSelectAllRows={withAnalytics(
            this.handleSelectAllRows,
            "SamplesView_select-all-rows_clicked"
          )}
          onSelectRow={this.handleSelectRow}
          onRowClick={this.handleRowClick}
          protectedColumns={protectedColumns}
          rowClassName={cs.tableDataRow}
          selectableKey="id"
          selected={selectedSampleIds}
          selectAllChecked={selectAllChecked}
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

  handleRowClick = ({ event, rowData }) => {
    const { onSampleSelected, samples } = this.props;
    const sample = find({ id: rowData.id }, samples);
    onSampleSelected && onSampleSelected({ sample, currentEvent: event });
    logAnalyticsEvent("SamplesView_row_clicked", {
      sampleId: sample.id,
      sampleName: sample.name,
    });
  };

  render() {
    const { currentDisplay } = this.props;
    const { phyloTreeCreationModalOpen } = this.state;
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
  mapPreviewedSamples: PropTypes.array,
  mapTilerKey: PropTypes.string,
  onClearFilters: PropTypes.func,
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
  samples: PropTypes.array,
  selectableIds: PropTypes.array.isRequired,
  selectedSampleIds: PropTypes.instanceOf(Set),
};

export default SamplesView;
