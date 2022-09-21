import cx from "classnames";
import { Button, Icon } from "czifui";
import {
  difference,
  find,
  filter,
  forEach,
  get,
  isEmpty,
  intersection,
  map,
  union,
  reduce,
  size,
  values,
} from "lodash/fp";
import React from "react";

import { Link as RouterLink } from "react-router-dom";
import { bulkKickoffWorkflowRuns } from "~/api";
import {
  trackEvent,
  withAnalytics,
  ANALYTICS_EVENT_NAMES,
} from "~/api/analytics";
import {
  getSampleMetadataFields,
  getWorkflowRunMetadataFields,
} from "~/api/metadata";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { AMR_V1_FEATURE } from "~/components/utils/features";
import PropTypes from "~/components/utils/propTypes";
import { showToast } from "~/components/utils/toast";
import BulkDownloadModal from "~/components/views/bulk_download/BulkDownloadModal";
import { showBulkDownloadNotification } from "~/components/views/bulk_download/BulkDownloadNotification";
import HeatmapCreationModal from "~/components/views/compare/HeatmapCreationModal";
import { TAXON_HEATMAP_MODAL_SAMPLES_MINIMUM } from "~/components/views/compare/SamplesHeatmapView/constants";
import { ObjectCollectionView } from "~/components/views/discovery/DiscoveryDataLayer";
import DiscoveryViewToggle from "~/components/views/discovery/DiscoveryViewToggle";
import QualityControl from "~/components/views/discovery/QualityControl";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
import csTableRenderer from "~/components/views/discovery/table_renderers.scss";
import NextcladeModal from "~/components/views/nextclade/NextcladeModal";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import CollectionModal from "~/components/views/samples/CollectionModal";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import { getURLParamString } from "~/helpers/url";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import {
  IconHeatmap,
  IconBackgroundModel,
  IconDownload,
  IconPhyloTree,
  IconNextcladeLarge,
  IconShare,
} from "~ui/icons";
import Label from "~ui/labels/Label";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";
import {
  workflowIsWorkflowRunEntity,
  WORKFLOWS,
  WORKFLOW_ENTITIES,
} from "~utils/workflows";

import {
  computeColumnsByWorkflow,
  DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW,
  DEFAULT_SORTED_COLUMN_BY_TAB,
} from "./ColumnConfiguration";
import ToolbarIcon from "./ToolbarIcon";
import {
  PipelineRunStatuses,
  SARS_COV_2,
  TRIGGERS,
  WORKFLOW_TRIGGERS,
  WORKFLOW_TRIGGERS_BY_DOMAIN,
} from "./constants";
import cs from "./samples_view.scss";

const MAX_NEXTCLADE_SAMPLES = 200;
const MAX_TAXON_HEATMAP_SAMPLES = 500;

class SamplesView extends React.Component {
  constructor(props, context) {
    super(props);

    this.state = {
      phyloTreeCreationModalOpen: false,
      bulkDownloadModalOpen: false,
      heatmapCreationModalOpen: false,
      nextcladeModalOpen: false,
      // This tooltip is reset whenever the selectedIds changes.
      bulkDownloadButtonTempTooltip: null,
      sarsCov2Count: 0,
      referenceSelectId: null,
      metadataFields: [],
      loading: true,
      /*
        We need to keep track of samples that have been created from the web app so the user doesn't
          create more than one AMR workflow run by clicking the BulkKickoffAmr trigger more than once.
        If the page refreshes, the SampleView will fetch the number of AMR workflow runs
          from the DB and will prevent the user from creating an AMR workflow run for that sample.
      */
      recentlyKickedOffAmrWorkflowRunsForSampleIds: new Set([]),
    };

    this.referenceSelectId = null;
    this.setupWorkflowConfigs();
  }

  componentDidMount() {
    this.fetchMetadataFieldsBySampleIds();
  }

  componentDidUpdate(prevProps) {
    const { selectedIds } = this.props;
    // Reset the tooltip whenever the selected samples changes.
    if (selectedIds !== prevProps.selectedIds) {
      this.setState({
        bulkDownloadButtonTempTooltip: null,
      });
    }
  }

  setupWorkflowConfigs = () => {
    this.configForWorkflow = {
      [WORKFLOWS.AMR.value]: {
        displayText: "antimicrobial resistance",
      },
      [WORKFLOWS.CONSENSUS_GENOME.value]: {
        displayText: "consensus genome",
      },
      [WORKFLOWS.SHORT_READ_MNGS.value]: {
        displayText: "sample",
      },
    };
  };

  fetchMetadataFieldsBySampleIds = async () => {
    const { selectableIds, showAllMetadata, workflow } = this.props;
    if (selectableIds && showAllMetadata) {
      let metadataFields = [];

      if (workflowIsWorkflowRunEntity(workflow)) {
        metadataFields = await getWorkflowRunMetadataFields(selectableIds);
      } else {
        metadataFields = await getSampleMetadataFields(selectableIds);
      }

      this.setState({ metadataFields });
    }
    this.setState({ loading: false });
  };

  handleSelectRow = (value, checked, event) => {
    const { objects, selectedIds, onUpdateSelectedIds, workflow } = this.props;
    const { referenceSelectId } = this;

    let newSelected = new Set(selectedIds);
    if (event.shiftKey && referenceSelectId) {
      const ids = objects.getIntermediateIds({
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

    onUpdateSelectedIds(newSelected);

    trackEvent("SamplesView_row_selected", {
      rowIsChecked: checked,
      rowType: find({ value: workflow }, values(WORKFLOWS)).entity,
      selectedId: value,
      numberOfSelectedIds: newSelected.size,
      workflow,
    });
  };

  handleSelectAllRows = checked => {
    const { selectableIds, selectedIds, onUpdateSelectedIds } = this.props;

    this.referenceSelectId = null;
    let newSelected = new Set(
      checked
        ? union(Array.from(selectedIds), selectableIds)
        : difference(Array.from(selectedIds), selectableIds),
    );
    onUpdateSelectedIds(newSelected);
  };

  handleSortColumn = ({ sortBy, sortDirection }) => {
    this.props.onSortColumn({ sortBy, sortDirection });
  };

  isSelectAllChecked = () => {
    const { selectableIds, selectedIds } = this.props;
    return (
      !isEmpty(selectableIds) &&
      isEmpty(difference(selectableIds, Array.from(selectedIds)))
    );
  };

  reset = () => {
    const { currentDisplay } = this.props;
    if (currentDisplay === "table") this.infiniteTable?.reset();
  };

  renderHeatmapTrigger = () => {
    const { selectedIds } = this.props;
    const { allowedFeatures = {} } = this.context || {};

    const heatmapOptions = [
      { text: "Taxon Heatmap", value: "/visualizations/heatmap" },
      { text: "AMR Heatmap", value: "/amr_heatmap" },
    ];

    const heatmapIcon = <IconHeatmap className={cs.icon} />;
    const disabledToolbarIcon = subtitle => (
      <ToolbarIcon
        className={cx(cs.action, cs.heatmap)}
        disabled
        icon={heatmapIcon}
        popupText="Heatmap"
        popupSubtitle={subtitle}
      />
    );

    if (selectedIds.size < 2) {
      return disabledToolbarIcon("Select at least 2 samples");
    } else if (selectedIds.size > MAX_TAXON_HEATMAP_SAMPLES) {
      return disabledToolbarIcon(
        `Select at most ${MAX_TAXON_HEATMAP_SAMPLES} samples`,
      );
    } else {
      return (
        <BareDropdown
          hideArrow
          className={cx(cs.action)}
          items={heatmapOptions.map(option => {
            if (
              allowedFeatures.includes("taxon_heatmap_presets") &&
              option.text === "Taxon Heatmap" &&
              selectedIds.size > TAXON_HEATMAP_MODAL_SAMPLES_MINIMUM
            ) {
              return (
                <BareDropdown.Item
                  key={option.text}
                  text={option.text}
                  onClick={withAnalytics(
                    this.handleHeatmapCreationModalOpen,
                    ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_HEATMAP_CREATION_MODAL_OPENED,
                  )}
                />
              );
            } else {
              const params = getURLParamString({
                sampleIds: Array.from(selectedIds),
              });
              const log = () =>
                trackEvent("SamplesView_heatmap-option_clicked", {
                  option,
                  selectedIds: selectedIds.size,
                });
              return (
                <BareDropdown.Item
                  key={option.text}
                  text={
                    <RouterLink
                      to={`${option.value}?${params}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {option.text}
                    </RouterLink>
                  }
                  onClick={log}
                />
              );
            }
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
    }
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
          "SamplesView_phylo-tree-modal-open_clicked",
        )}
      />
    );
  };

  renderBulkDownloadTrigger = () => {
    const { selectedIds, workflow } = this.props;
    const { bulkDownloadButtonTempTooltip } = this.state;
    const downloadIcon = <IconDownload className={cx(cs.icon, cs.download)} />;
    return (
      <ToolbarIcon
        className={cs.action}
        icon={downloadIcon}
        popperDependencies={[bulkDownloadButtonTempTooltip]}
        popupText={bulkDownloadButtonTempTooltip || "Download"}
        popupSubtitle={selectedIds.size === 0 ? "Select at least 1 sample" : ""}
        disabled={selectedIds.size === 0}
        onClick={withAnalytics(
          this.handleBulkDownloadModalOpen,
          "SamplesView_bulk-download-modal-open_clicked",
          { workflow },
        )}
      />
    );
  };

  renderCollectionTrigger = () => {
    const { objects, selectedIds, workflow } = this.props;

    const targetSamples = objects.loaded;

    const backgroundIcon = (
      <IconBackgroundModel className={cx(cs.icon, cs.background)} />
    );

    return selectedIds.size < 2 ? (
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
        selectedSampleIds={selectedIds}
        fetchedSamples={targetSamples.filter(sample =>
          selectedIds.has(sample.id),
        )}
        workflow={workflow}
      />
    );
  };

  renderNextcladeTrigger = () => {
    const { objects, selectedIds } = this.props;

    const selectedObjects = objects.loaded.filter(object =>
      selectedIds.has(object.id),
    );

    const sarsCov2Count = selectedObjects
      .map(object => get(["referenceAccession", "taxonName"], object))
      .reduce((n, taxonName) => {
        return n + (taxonName === SARS_COV_2);
      }, 0);

    const downloadIcon = (
      <IconNextcladeLarge className={cx(cs.icon, cs.nextclade)} />
    );
    const getPopupSubtitle = () => {
      if (sarsCov2Count > MAX_NEXTCLADE_SAMPLES) {
        return `Select at most ${MAX_NEXTCLADE_SAMPLES} SARS-CoV-2 samples`;
      } else if (sarsCov2Count === 0) {
        return "Select at least 1 SARS-CoV-2 sample";
      } else {
        return "";
      }
    };
    return (
      <ToolbarIcon
        className={cs.action}
        icon={downloadIcon}
        popupText="Nextclade"
        popupSubtitle={getPopupSubtitle()}
        disabled={sarsCov2Count === 0 || sarsCov2Count > MAX_NEXTCLADE_SAMPLES}
        onClick={withAnalytics(
          this.handleNextcladeModalOpen,
          "SamplesView_nextclade-modal-open_clicked",
        )}
      />
    );
  };

  renderGenEpiTrigger = () => {
    const { objects, selectedIds } = this.props;
    const { allowedFeatures = {} } = this.context || {};

    if (!allowedFeatures.includes("genepi")) {
      return;
    }

    const selectedObjects = objects.loaded.filter(object =>
      selectedIds.has(object.id),
    );

    const sarsCov2Count = selectedObjects
      .map(object => get(["referenceAccession", "taxonName"], object))
      .reduce((n, taxonName) => {
        return n + (taxonName === SARS_COV_2);
      }, 0);

    // TODO: this is currently a placeholder icon, replace with GenEpi
    // integration icon once it's created.
    const uploadIcon = <IconShare className={cx(cs.icon, cs.nextclade)} />;

    const getPopupSubtitle = () => {
      if (sarsCov2Count === 0) {
        return "Select at least 1 SARS-CoV-2 sample";
      } else {
        return "";
      }
    };

    return (
      <ToolbarIcon
        className={cs.action}
        icon={uploadIcon}
        popupText="Send samples to CZ Gen Epi"
        popupSubtitle={getPopupSubtitle()}
        disabled={sarsCov2Count === 0}
      />
    );
  };

  renderBulkKickoffAmr = () => {
    const { objects, selectedIds } = this.props;
    const { allowedFeatures = {} } = this.context || {};

    if (!allowedFeatures.includes(AMR_V1_FEATURE)) {
      return;
    }

    const selectedObjects = objects.loaded.filter(object =>
      selectedIds.has(object.id),
    );
    const numOfSelectedObjects = size(selectedObjects);

    const downloadIcon = (
      <Icon sdsIcon="dotsHorizontal" sdsSize="s" sdsStyle="button" />
    );

    return (
      <ToolbarIcon
        className={cs.action}
        icon={downloadIcon}
        popupText="Run Antimicrobial Resistance Pipeline (Beta)"
        popupSubtitle={
          numOfSelectedObjects === 0 ? "Select at least 1 sample" : ""
        }
        disabled={numOfSelectedObjects === 0}
        onClick={withAnalytics(
          this.handleBulkKickoffAmrClick,
          ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED,
        )}
      />
    );
  };

  handleBulkKickoffAmrClick = async () => {
    const { objects, selectedIds } = this.props;

    const selectedObjects = filter(
      object => selectedIds.has(object.id),
      objects.loaded,
    );
    const amrPipelineEligibility = reduce(
      (result, sample) => {
        if (this.isNotEligibleForAmrPipeline(sample)) {
          result.ineligible.push(sample);
        } else {
          result.eligible.push(sample);
        }
        return result;
      },
      { eligible: [], ineligible: [] },
      selectedObjects,
    );

    if (size(amrPipelineEligibility.eligible) > 0) {
      const sampleIdsToKickoffAmr = map("id", amrPipelineEligibility.eligible);
      this.kickoffAmrPipelineForSamples(sampleIdsToKickoffAmr);
      this.renderAmrPipelineBulkKickedOffNotification();

      this.setState(
        ({
          recentlyKickedOffAmrWorkflowRunsForSampleIds: prevRecentlyKickedOffAmrWorkflowRunsForSampleIds,
        }) => ({
          recentlyKickedOffAmrWorkflowRunsForSampleIds: new Set([
            ...Array.from(prevRecentlyKickedOffAmrWorkflowRunsForSampleIds),
            ...sampleIdsToKickoffAmr,
          ]),
        }),
      );
    }

    if (size(amrPipelineEligibility.ineligible) > 0) {
      const ineligibleSampleNames = map(
        sample => get("sample.name", sample),
        amrPipelineEligibility.ineligible,
      );
      // We need this 10ms delay to allow the first toast to render properly before showing the second toast
      await this.delay(10);
      this.renderIneligibleSamplesForBulkKickoffAmrNotification(
        ineligibleSampleNames,
      );
    }
  };

  isNotEligibleForAmrPipeline = sample => {
    const { recentlyKickedOffAmrWorkflowRunsForSampleIds } = this.state;

    const failedToUploadSample = !isEmpty(get("sample.uploadError", sample));
    const nonHostReadsUnavailable = !(
      get("sample.pipelineRunStatus", sample) === PipelineRunStatuses.Complete
    );
    const hasExistingAmrWorkflowRunInDatabase =
      get(
        ["sample", "workflowRunsCountByWorkflow", WORKFLOWS.AMR.value],
        sample,
      ) > 0;
    // `recentlyKickedOffAmrWorkflowRunsForSampleIds` only gets updated when the user sucessfully
    // kicks off new AMR workflow runs by clicking the BulkKickoffAmr trigger
    const alreadyKickedOffAmrWorkflowRun = recentlyKickedOffAmrWorkflowRunsForSampleIds.has(
      sample.id,
    );

    return (
      failedToUploadSample ||
      nonHostReadsUnavailable ||
      hasExistingAmrWorkflowRunInDatabase ||
      alreadyKickedOffAmrWorkflowRun
    );
  };

  delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  kickoffAmrPipelineForSamples = sampleIds => {
    bulkKickoffWorkflowRuns({
      sampleIds,
      workflow: WORKFLOWS.AMR.value,
    });
  };

  renderAmrPipelineBulkKickedOffNotification = () => {
    const renderAmrNotification = onClose => (
      <Notification displayStyle="elevated" type="info" onClose={onClose}>
        <div className={cs.amrNotification}>
          We&apos;ve started running your samples on the Antimicrobial
          Resistance (Beta) pipeline. To view your samples, visit the{" "}
          {/* TODO: When the user clicks this AMR link, it should switch to the AMR tab */}
          <div className={cs.amrTab}>Antimicrobial Resistance</div> tab.
        </div>
      </Notification>
    );

    showToast(({ closeToast }) => renderAmrNotification(closeToast), {
      autoClose: 12000,
    });
  };

  renderIneligibleSamplesForBulkKickoffAmrNotification = invalidSampleNames => {
    const header = (
      <div>
        <span className={cs.highlight}>
          {invalidSampleNames.length} sample
          {invalidSampleNames.length > 1 ? "s" : ""} won&apos;t be run
        </span>{" "}
        on the Antimicrobial Resistance (Beta) pipeline because they either
        failed, are still processing, or were already run.
      </div>
    );

    const content = (
      <span>
        {invalidSampleNames.map((name, index) => {
          return (
            <div key={index} className={cs.messageLine}>
              {name}
            </div>
          );
        })}
      </span>
    );

    const renderAmrNotification = onClose => (
      <AccordionNotification
        header={header}
        content={content}
        open={false}
        type={"warning"}
        displayStyle={"elevated"}
        onClose={onClose}
      />
    );

    showToast(({ closeToast }) => renderAmrNotification(closeToast), {
      autoClose: 12000,
    });
  };

  renderTriggers = () => {
    const { domain, selectedIds, workflow } = this.props;

    const triggers = {
      [TRIGGERS.backgroundModel]: this.renderCollectionTrigger,
      [TRIGGERS.heatmap]: this.renderHeatmapTrigger,
      [TRIGGERS.phylogeneticTree]: this.renderPhyloTreeTrigger,
      [TRIGGERS.download]: this.renderBulkDownloadTrigger,
      [TRIGGERS.nextclade]: this.renderNextcladeTrigger,
      [TRIGGERS.genepi]: this.renderGenEpiTrigger,
      [TRIGGERS.bulk_kickoff_amr]: this.renderBulkKickoffAmr,
    };
    // Get workflows triggers available in the current domain and workflow tab
    const triggersAvailable = intersection(
      WORKFLOW_TRIGGERS_BY_DOMAIN[domain],
      WORKFLOW_TRIGGERS[workflow],
    );
    const triggersToRender = triggersAvailable.map(trigger => (
      <React.Fragment key={`${workflow}-${trigger}`}>
        {triggers[trigger]()}
      </React.Fragment>
    ));

    return (
      <>
        <div className={cs.counterContainer}>
          <Label
            circular
            className={cs.counter}
            // Log this no-op so we know if users want a way to view their selected samples
            onClick={() => trackEvent(`SamplesView_sample-counter_clicked`)}
            text={`${selectedIds.size}`}
          />
          <span className={cs.label}>Selected</span>
        </div>
        <div className={cs.separator} />
        <div className={cs.actions}>{triggersToRender}</div>
      </>
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

  renderFilteredCount = () => {
    const {
      hasAtLeastOneFilterApplied,
      selectableIds,
      onClearFilters,
      userDataCounts,
      workflow,
    } = this.props;

    if (!isEmpty(userDataCounts)) {
      const totalNumberOfObjects =
        userDataCounts.sampleCountByWorkflow[workflow];
      const pluralGrammar = `${totalNumberOfObjects === 1 ? "" : "s"}`;

      const workflowConfig = this.configForWorkflow[workflow];
      const workflowDisplayText = `${workflowConfig.displayText}${pluralGrammar}`;
      const filteredCountByWorkflowMessage = `${selectableIds?.length ||
        0} out of ${totalNumberOfObjects} ${workflowDisplayText}`;

      const description = hasAtLeastOneFilterApplied
        ? filteredCountByWorkflowMessage
        : `${selectableIds?.length} ${workflowDisplayText}`;

      return (
        <div className={cs.filteredCount}>
          {description}
          {hasAtLeastOneFilterApplied && (
            <Button
              sdsStyle="minimal"
              sdsType="secondary"
              onClick={onClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      );
    }
  };

  renderTable = () => {
    const {
      activeColumns,
      hideAllTriggers,
      onActiveColumnsChange,
      onLoadRows,
      protectedColumns,
      selectedIds,
      snapshotShareId,
      sortable,
      sortBy,
      sortDirection,
      workflow,
    } = this.props;

    const { metadataFields, loading } = this.state;

    if (loading) return null;

    const columns = computeColumnsByWorkflow({
      workflow,
      metadataFields,
      basicIcon: !!snapshotShareId,
    });

    // Note: If the specified sortBy column (ie. a custom metadata field) is not available on this view,
    // we expect the fetched samples to be sorted by the default column and we will bold the default column header.
    // This will not overwrite the sortBy in session storage.
    const sortByNotAvailable = !columns.some(c => c.dataKey === sortBy);
    const sortedColumn = sortByNotAvailable
      ? DEFAULT_SORTED_COLUMN_BY_TAB["samples"]
      : sortBy;

    // TODO(tiago): replace by automated cell height computing
    const rowHeight = 66;
    const selectAllChecked = this.isSelectAllChecked();
    return (
      <div className={cs.table}>
        <InfiniteTable
          ref={infiniteTable => (this.infiniteTable = infiniteTable)}
          columns={columns}
          defaultRowHeight={rowHeight}
          draggableColumns
          initialActiveColumns={activeColumns}
          loadingClassName={csTableRenderer.loading}
          onActiveColumnsChange={onActiveColumnsChange}
          onLoadRows={onLoadRows}
          onSelectAllRows={withAnalytics(
            this.handleSelectAllRows,
            "SamplesView_select-all-rows_clicked",
          )}
          onSelectRow={this.handleSelectRow}
          onRowClick={this.handleRowClick}
          onSortColumn={this.handleSortColumn}
          protectedColumns={protectedColumns}
          rowClassName={cs.tableDataRow}
          selectableKey={hideAllTriggers ? null : "id"}
          selected={selectedIds}
          selectAllChecked={selectAllChecked}
          selectableCellClassName={cs.selectableCell}
          sortable={sortable}
          sortBy={sortedColumn}
          sortDirection={sortDirection}
        />
      </div>
    );
  };

  renderDisplaySwitcher = () => {
    const { currentDisplay, onDisplaySwitch, projectId, workflow } = this.props;

    return (
      <DiscoveryViewToggle
        currentDisplay={currentDisplay}
        onDisplaySwitch={display => {
          onDisplaySwitch(display);
          trackEvent(`SamplesView_${display}-switch_clicked`);
        }}
        includePLQC={
          !!projectId && workflow === WORKFLOWS.SHORT_READ_MNGS.value
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
      <QualityControl
        projectId={projectId}
        handleBarClick={onPLQCHistogramBarClick}
        filters={filters}
        filtersSidebarOpen={filtersSidebarOpen}
        sampleStatsSidebarOpen={sampleStatsSidebarOpen}
      />
    );
  };

  renderDisplay = () => {
    const { currentDisplay } = this.props;
    switch (currentDisplay) {
      case "table":
        return this.renderTable();
      case "map":
        return this.renderMap();
      case "plqc":
        return this.renderQualityControl();
    }
  };

  handlePhyloModalOpen = () => {
    this.setState({ phyloTreeCreationModalOpen: true });
  };

  handlePhyloModalClose = () => {
    this.setState({ phyloTreeCreationModalOpen: false });
  };

  handleBulkDownloadModalOpen = () => {
    const { selectedIds, workflowEntity } = this.props;
    const { appConfig, admin } = this.context || {};

    if (!appConfig.maxObjectsBulkDownload) {
      this.setState({
        bulkDownloadButtonTempTooltip:
          "Unexpected issue. Please contact us for help.",
      });
    } else if (selectedIds.size > appConfig.maxObjectsBulkDownload && !admin) {
      // This check ensures that the # of selected objects does not surpass our max object limit that we allow in bulk downloads.
      // There is a separate check in BulkDownloadModal that looks for a max number of objects allowed and disables the
      // 'original input file download' option if the # of selected objects surpasses that limit.
      const objectToDownload =
        workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
          ? "consensus genomes"
          : "samples";

      this.setState({
        bulkDownloadButtonTempTooltip: `No more than ${appConfig.maxObjectsBulkDownload} ${objectToDownload} allowed in one download.`,
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

  handleHeatmapCreationModalOpen = () => {
    this.setState({ heatmapCreationModalOpen: true });
  };

  handleHeatmapCreationModalClose = () => {
    this.setState({ heatmapCreationModalOpen: false });
  };

  handleNextcladeModalOpen = () => {
    this.setState({ nextcladeModalOpen: true });
  };

  handleNextcladeModalClose = () => {
    this.setState({ nextcladeModalOpen: false });
  };

  handleRowClick = ({ event, rowData }) => {
    const { onObjectSelected, objects, workflowEntity } = this.props;
    const object = objects.get(rowData.id);
    onObjectSelected && onObjectSelected({ object, currentEvent: event });

    trackEvent("SamplesView_row_clicked", {
      sampleId: object.id,
      sampleName: object?.sample?.name,
      workflowEntity,
    });
  };

  render() {
    const {
      currentDisplay,
      selectedIds,
      snapshotShareId,
      workflow,
      workflowEntity,
    } = this.props;
    const {
      bulkDownloadModalOpen,
      heatmapCreationModalOpen,
      nextcladeModalOpen,
      phyloTreeCreationModalOpen,
    } = this.state;

    return (
      <div className={cs.container}>
        {currentDisplay === "table" || currentDisplay === "plqc" ? (
          !snapshotShareId && this.renderToolbar()
        ) : (
          <NarrowContainer>{this.renderToolbar()}</NarrowContainer>
        )}
        {this.renderFilteredCount()}
        {this.renderDisplay()}
        {phyloTreeCreationModalOpen && (
          <PhyloTreeCreationModal
            // TODO(tiago): migrate phylo tree to use api (or read csrf from context) and remove this
            csrf={document.getElementsByName("csrf-token")[0].content}
            onClose={withAnalytics(
              this.handlePhyloModalClose,
              "SamplesView_phylo-tree-modal_closed",
            )}
          />
        )}
        {bulkDownloadModalOpen && (
          <BulkDownloadModal
            open
            onClose={withAnalytics(
              this.handleBulkDownloadModalClose,
              "SamplesView_bulk-download-modal_closed",
            )}
            onGenerate={this.handleBulkDownloadGenerate}
            selectedIds={selectedIds}
            workflow={workflow}
            workflowEntity={workflowEntity}
          />
        )}
        {heatmapCreationModalOpen && (
          <HeatmapCreationModal
            open
            onClose={withAnalytics(
              this.handleHeatmapCreationModalClose,
              ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_HEATMAP_CREATION_MODAL_CLOSED,
            )}
            selectedIds={selectedIds}
          />
        )}
        {nextcladeModalOpen && (
          <NextcladeModal
            open
            onClose={withAnalytics(
              this.handleNextcladeModalClose,
              "SamplesView_nextclade-modal_closed",
            )}
            selectedIds={selectedIds}
            workflowEntity={workflowEntity}
          />
        )}
      </div>
    );
  }
}

SamplesView.defaultProps = {
  activeColumns:
    DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW[WORKFLOWS.SHORT_READ_MNGS.value],
  protectedColumns: ["sample"],
  currentDisplay: "table",
  workflow: WORKFLOWS.SHORT_READ_MNGS.value,
};

SamplesView.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string),
  admin: PropTypes.bool,
  currentDisplay: PropTypes.string.isRequired,
  currentTab: PropTypes.string.isRequired,
  domain: PropTypes.string,
  filters: PropTypes.object,
  filtersSidebarOpen: PropTypes.bool,
  hasAtLeastOneFilterApplied: PropTypes.bool,
  hideAllTriggers: PropTypes.bool,
  mapLevel: PropTypes.string,
  mapLocationData: PropTypes.objectOf(PropTypes.Location),
  mapPreviewedLocationId: PropTypes.number,
  mapTilerKey: PropTypes.string,
  numOfMngsSamples: PropTypes.number,
  objects: PropTypes.instanceOf(ObjectCollectionView),
  onActiveColumnsChange: PropTypes.func,
  onClearFilters: PropTypes.func,
  onDisplaySwitch: PropTypes.func,
  onLoadRows: PropTypes.func.isRequired,
  onMapClick: PropTypes.func,
  onMapLevelChange: PropTypes.func,
  onMapMarkerClick: PropTypes.func,
  onMapTooltipTitleClick: PropTypes.func,
  onPLQCHistogramBarClick: PropTypes.func,
  onObjectSelected: PropTypes.func,
  onUpdateSelectedIds: PropTypes.func,
  onSortColumn: PropTypes.func,
  projectId: PropTypes.number,
  protectedColumns: PropTypes.array,
  sampleStatsSidebarOpen: PropTypes.bool,
  selectableIds: PropTypes.array,
  selectedIds: PropTypes.instanceOf(Set),
  showAllMetadata: PropTypes.bool,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string,
  snapshotShareId: PropTypes.string,
  sortable: PropTypes.bool,
  userDataCounts: PropTypes.object,
  workflow: PropTypes.string,
  workflowEntity: PropTypes.string,
};

SamplesView.contextType = UserContext;

export default SamplesView;
