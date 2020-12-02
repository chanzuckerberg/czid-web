import cx from "classnames";
import { compact, difference, isEmpty, union, xor } from "lodash/fp";
import React from "react";

import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "~/components/utils/propTypes";
import BulkDownloadModal from "~/components/views/bulk_download/BulkDownloadModal";
import { showBulkDownloadNotification } from "~/components/views/bulk_download/BulkDownloadNotification";
import NextcladeModal from "~/components/views/nextclade/NextcladeModal";
import { ObjectCollectionView } from "~/components/views/discovery/DiscoveryDataLayer";
import DiscoveryViewToggle from "~/components/views/discovery/DiscoveryViewToggle";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
import QualityControl from "~/components/views/discovery/QualityControl";
import csTableRenderer from "~/components/views/discovery/table_renderers.scss";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import CollectionModal from "~/components/views/samples/CollectionModal";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import { getURLParamString } from "~/helpers/url";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import {
  HeatmapIcon,
  IconBackgroundModel,
  IconDownload,
  IconPhyloTree,
  IconNextcladeLarge,
} from "~ui/icons";
import Label from "~ui/labels/Label";
import { WORKFLOWS } from "~utils/workflows";
import { TRIGGERS, WORKFLOW_TRIGGERS } from "./constants";

import {
  computeColumnsByWorkflow,
  DEFAULTS_BY_WORKFLOW,
} from "./ColumnConfiguration";
import cs from "./samples_view.scss";
import ToolbarIcon from "./ToolbarIcon";

class SamplesView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      phyloTreeCreationModalOpen: false,
      bulkDownloadModalOpen: false,
      nextcladeModalOpen: false,
      // This tooltip is reset whenever the selectedSampleIds changes.
      bulkDownloadButtonTempTooltip: null,
    };

    const { snapshotShareId } = this.props;

    this.columnsByWorkflow = computeColumnsByWorkflow({
      basicIcon: !!snapshotShareId,
    });
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
      <IconPhyloTree className={cx(cs.icon, cs.phyloTree)} />
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

  renderBulkDownloadTrigger = () => {
    const { selectedSampleIds, workflow } = this.props;
    const { bulkDownloadButtonTempTooltip } = this.state;
    const downloadIcon = <IconDownload className={cx(cs.icon, cs.download)} />;
    return (
      <ToolbarIcon
        className={cs.action}
        icon={downloadIcon}
        popperDependencies={[bulkDownloadButtonTempTooltip]}
        popupText={bulkDownloadButtonTempTooltip || "Download"}
        popupSubtitle={
          selectedSampleIds.size === 0 ? "Select at least 1 sample" : ""
        }
        disabled={selectedSampleIds.size === 0}
        onClick={withAnalytics(
          this.handleBulkDownloadModalOpen,
          "SamplesView_bulk-download-modal-open_clicked",
          { workflow }
        )}
      />
    );
  };

  renderCollectionTrigger = () => {
    const { samples, selectedSampleIds, workflow } = this.props;

    const targetSamples = samples.loaded;

    const backgroundIcon = (
      <IconBackgroundModel className={cx(cs.icon, cs.background)} />
    );

    return selectedSampleIds.size < 2 ? (
      <ToolbarIcon
        className={cs.action}
        disabled
        icon={backgroundIcon}
        popupText="Background Model"
        popupSubtitle="Select at least 2 samples"
      />
    ) : (
      <CollectionModal
        trigger={
          <ToolbarIcon
            className={cs.action}
            icon={backgroundIcon}
            popupText="Background Model"
          />
        }
        selectedSampleIds={selectedSampleIds}
        fetchedSamples={targetSamples.filter(sample =>
          selectedSampleIds.has(sample.id)
        )}
        workflow={workflow}
      />
    );
  };

  renderNextcladeTrigger = () => {
    const { selectedSampleIds } = this.props;
    const downloadIcon = (
      <IconNextcladeLarge className={cx(cs.icon, cs.nextclade)} />
    );

    return (
      <ToolbarIcon
        className={cs.action}
        icon={downloadIcon}
        popupText="Nextclade"
        popupSubtitle={
          selectedSampleIds.size === 0 ? "Select at least 1 sample" : ""
        }
        disabled={selectedSampleIds.size === 0}
        onClick={withAnalytics(
          this.handleNextcladeModalOpen,
          "SamplesView_nextclade-modal-open_clicked"
        )}
      />
    );
  };

  renderTriggers = () => {
    const { allowedFeatures, selectedSampleIds, workflow } = this.props;
    const triggersToHide = compact([
      !allowedFeatures.includes("nextclade") && TRIGGERS.nextclade,
    ]);

    const triggers = {
      [TRIGGERS.backgroundModel]: this.renderCollectionTrigger,
      [TRIGGERS.heatmap]: this.renderHeatmapTrigger,
      [TRIGGERS.phylogeneticTree]: this.renderPhyloTreeTrigger,
      [TRIGGERS.download]: this.renderBulkDownloadTrigger,
      [TRIGGERS.nextclade]: this.renderNextcladeTrigger,
    };

    const triggersToRender = xor(
      triggersToHide,
      WORKFLOW_TRIGGERS[workflow]
    ).map(trigger => (
      <React.Fragment key={`${workflow}-${trigger}`}>
        {triggers[trigger]()}
      </React.Fragment>
    ));

    return (
      <React.Fragment>
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
        <div className={cs.actions}>{triggersToRender}</div>
      </React.Fragment>
    );
  };

  renderToolbar = () => {
    const { hideAllTriggers } = this.props;
    return (
      <div className={cs.samplesToolbar}>
        {this.renderDisplaySwitcher()}
        <div className={cs.fluidBlank} />
        {!hideAllTriggers && this.renderTriggers()}
      </div>
    );
  };

  renderTable = () => {
    const {
      activeColumns,
      hideAllTriggers,
      onActiveColumnsChange,
      onLoadRows,
      protectedColumns,
      selectedSampleIds,
      workflow,
    } = this.props;

    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 66;
    const selectAllChecked = this.isSelectAllChecked();
    return (
      <div className={cs.table}>
        <InfiniteTable
          ref={infiniteTable => (this.infiniteTable = infiniteTable)}
          columns={this.columnsByWorkflow[workflow]}
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
          selectableKey={hideAllTriggers ? null : "id"}
          selected={selectedSampleIds}
          selectAllChecked={selectAllChecked}
          selectableCellClassName={cs.selectableCell}
        />
      </div>
    );
  };

  renderDisplaySwitcher = () => {
    const { currentDisplay, onDisplaySwitch, projectId, workflow } = this.props;
    const { allowedFeatures = {} } = this.context || {};

    return (
      <DiscoveryViewToggle
        currentDisplay={currentDisplay}
        onDisplaySwitch={display => {
          onDisplaySwitch(display);
          logAnalyticsEvent(`SamplesView_${display}-switch_clicked`);
        }}
        includePLQC={
          !!projectId &&
          workflow !== WORKFLOWS.CONSENSUS_GENOME.value &&
          allowedFeatures.includes("plqc")
        }
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

  renderQualityControl = () => {
    const {
      projectId,
      onPLQCHistogramBarClick,
      filters,
      filtersSidebarOpen,
      sampleStatsSidebarOpen,
    } = this.props;
    return (
      <div className={cs.table}>
        <QualityControl
          projectId={projectId}
          handleBarClick={onPLQCHistogramBarClick}
          filters={filters}
          filtersSidebarOpen={filtersSidebarOpen}
          sampleStatsSidebarOpen={sampleStatsSidebarOpen}
        />
      </div>
    );
  };

  renderDisplay = () => {
    const { currentDisplay } = this.props;
    return currentDisplay === "table"
      ? this.renderTable()
      : currentDisplay === "map"
      ? this.renderMap()
      : this.renderQualityControl();
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
        bulkDownloadButtonTempTooltip: `No more than ${appConfig.maxSamplesBulkDownload} samples allowed in one download.`,
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

  handleNextcladeModalOpen = () => {
    this.setState({ nextcladeModalOpen: true });
  };

  handleNextcladeModalClose = () => {
    this.setState({ nextcladeModalOpen: false });
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
    const {
      currentDisplay,
      samples,
      selectedSampleIds,
      snapshotShareId,
      workflow,
    } = this.props;
    const {
      phyloTreeCreationModalOpen,
      bulkDownloadModalOpen,
      nextcladeModalOpen,
    } = this.state;

    return (
      <div className={cs.container}>
        {currentDisplay === "table" || currentDisplay === "plqc" ? (
          !snapshotShareId && this.renderToolbar()
        ) : (
          <NarrowContainer>{this.renderToolbar()}</NarrowContainer>
        )}
        {this.renderDisplay()}
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
        {bulkDownloadModalOpen && (
          <BulkDownloadModal
            open
            onClose={withAnalytics(
              this.handleBulkDownloadModalClose,
              "SamplesView_bulk-download-modal_closed"
            )}
            selectedSampleIds={selectedSampleIds}
            workflow={workflow}
            onGenerate={this.handleBulkDownloadGenerate}
          />
        )}
        {nextcladeModalOpen && (
          <NextcladeModal
            open
            onClose={withAnalytics(
              this.handleNextcladeModalClose,
              "SamplesView_nextclade-modal_closed"
            )}
            samples={samples.entries}
            selectedSampleIds={selectedSampleIds}
          />
        )}
      </div>
    );
  }
}

SamplesView.defaultProps = {
  activeColumns: DEFAULTS_BY_WORKFLOW[WORKFLOWS.SHORT_READ_MNGS.value],
  protectedColumns: ["sample"],
  currentDisplay: "table",
  workflow: WORKFLOWS.SHORT_READ_MNGS.value,
};

SamplesView.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string),
  admin: PropTypes.bool,
  currentDisplay: PropTypes.string.isRequired,
  currentTab: PropTypes.string.isRequired,
  filtersSidebarOpen: PropTypes.bool,
  hideAllTriggers: PropTypes.bool,
  mapLevel: PropTypes.string,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  mapPreviewedLocationId: PropTypes.number,
  mapTilerKey: PropTypes.string,
  onActiveColumnsChange: PropTypes.func,
  onClearFilters: PropTypes.func,
  onDisplaySwitch: PropTypes.func,
  onLoadRows: PropTypes.func.isRequired,
  onMapClick: PropTypes.func,
  onMapLevelChange: PropTypes.func,
  onMapMarkerClick: PropTypes.func,
  onMapTooltipTitleClick: PropTypes.func,
  onPLQCHistogramBarClick: PropTypes.func,
  onSampleSelected: PropTypes.func,
  onSelectedSamplesUpdate: PropTypes.func,
  projectId: PropTypes.number,
  protectedColumns: PropTypes.array,
  samples: PropTypes.instanceOf(ObjectCollectionView),
  sampleStatsSidebarOpen: PropTypes.bool,
  selectableIds: PropTypes.array.isRequired,
  selectedSampleIds: PropTypes.instanceOf(Set),
  snapshotShareId: PropTypes.string,
  workflow: PropTypes.string,
};

SamplesView.contextType = UserContext;

export default SamplesView;
