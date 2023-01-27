import cx from "classnames";
import { Button } from "czifui";
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
import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Link as RouterLink } from "react-router-dom";
import { SortDirectionType } from "react-virtualized";
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
import {
  AMR_V1_FEATURE,
  HEATMAP_ELASTICSEARCH_FEATURE,
} from "~/components/utils/features";
import { showToast } from "~/components/utils/toast";
import BulkDownloadModal from "~/components/views/bulk_download/BulkDownloadModal";
import { showBulkDownloadNotification } from "~/components/views/bulk_download/BulkDownloadNotification";
import HeatmapCreationModal from "~/components/views/compare/HeatmapCreationModal";
import { TAXON_HEATMAP_MODAL_SAMPLES_MINIMUM } from "~/components/views/compare/SamplesHeatmapView/constants";
import DiscoveryViewToggle from "~/components/views/discovery/DiscoveryViewToggle";
import QualityControl from "~/components/views/discovery/QualityControl";
import DiscoveryMap from "~/components/views/discovery/mapping/DiscoveryMap";
import csTableRenderer from "~/components/views/discovery/table_renderers.scss";
import NextcladeModal from "~/components/views/nextclade/NextcladeModal";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import CollectionModal from "~/components/views/samples/CollectionModal";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import { getURLParamString } from "~/helpers/url";
import {
  PipelineTypeRun,
  SamplesViewProps,
  SamplesViewHandle,
} from "~/interface/samplesView";
import { MetadataType } from "~/interface/shared";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import { IconLoading } from "~ui/icons";
import Label from "~ui/labels/Label";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import Notification from "~ui/notifications/Notification";
import {
  workflowIsWorkflowRunEntity,
  WORKFLOWS,
  WORKFLOW_ENTITIES,
} from "~utils/workflows";

import BulkSamplesActionsMenu from "./BulkSamplesActionsMenu";
import {
  computeColumnsByWorkflow,
  DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW,
  DEFAULT_SORTED_COLUMN_BY_TAB,
} from "./ColumnConfiguration";
import ToolbarButtonIcon from "./ToolbarButtonIcon";
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

const SHORT_READ_MNGS_VALUE = WORKFLOWS.SHORT_READ_MNGS.value;

/**
 * Upon changing SamplesView from a class to a function component,
 * forwardRef was added to receive a ref from DiscoveryView and
 * use it to define reset() in the useImpertiveHandle hook.
 * https://stackoverflow.com/questions/37949981/call-child-method-from-parent
 * https://beta.reactjs.org/reference/react/forwardRef (01/2023 - smccany)
 */

const SamplesView = forwardRef(function SamplesView(
  {
    onObjectSelected,
    workflowEntity,
    onDisplaySwitch,
    projectId,
    selectedIds,
    selectableIds,
    currentDisplay = "table",
    onSortColumn,
    showAllMetadata,
    objects,
    workflow = WORKFLOWS.SHORT_READ_MNGS.value,
    onUpdateSelectedIds,
    handleNewAmrCreationsFromMngs,
    domain,
    hideAllTriggers,
    hasAtLeastOneFilterApplied,
    onClearFilters,
    userDataCounts,
    activeColumns = DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW[SHORT_READ_MNGS_VALUE],
    onActiveColumnsChange,
    onLoadRows,
    protectedColumns = ["sample"],
    snapshotShareId,
    sortable,
    sortBy,
    sortDirection,
    currentTab,
    mapLevel,
    mapLocationData,
    mapPreviewedLocationId,
    mapTilerKey,
    onMapLevelChange,
    onMapClick,
    onMapMarkerClick,
    onMapTooltipTitleClick,
    onPLQCHistogramBarClick,
    filters,
    filtersSidebarOpen,
    sampleStatsSidebarOpen,
  }: SamplesViewProps,
  ref: React.Ref<SamplesViewHandle>,
) {
  const userContext = useContext(UserContext);
  const { allowedFeatures, appConfig, admin } = userContext || {};

  // useImperitiveHandle exposes the reset function as a ref to DiscoveryView.
  useImperativeHandle(ref, () => ({
    reset() {
      if (currentDisplay === "table") infiniteTable?.reset();
    },
  }));

  let configForWorkflow: {
    [workflow: string]: { singlularDisplay: string; pluralDisplay: string };
  };
  let infiniteTable: InfiniteTable;
  const [referenceSelectId, setReferenceSelectId] = useState(null);
  const [phyloCreationModalOpen, setPhyloCreationModalOpen] = useState(false);
  const [bulkDownloadModalOpen, setBulkDownloadModalOpen] = useState(false);
  const [heatmapCreationModalOpen, setHeatmapCreationModalOpen] = useState(
    false,
  );
  const [nextcladeModalOpen, setNextcladeModalOpen] = useState(false);
  const [metadataFields, setMetadataFields] = useState<MetadataType[]>([]);
  const [loading, setLoading] = useState(true);
  /*
  We need to keep track of samples that have been created from the web app so the user doesn't
  create more than one AMR workflow run by clicking the BulkKickoffAmr trigger more than once.
  If the page refreshes, the SampleView will fetch the number of AMR workflow runs
  from the DB and will prevent the user from creating an AMR workflow run for that sample.
  */
  const [
    recentlyKickedOffAmrWorkflowRunsForSampleIds,
    setRecentlyKickedOffAmrWorkflowRunsForSampleIds,
  ] = useState<Set<number>>(new Set([]));

  // This tooltip is reset whenever the selectedIds changes.
  const [
    bulkDownloadButtonTempTooltip,
    setBulkDownloadButtonTempTooltip,
  ] = useState<string>(null);

  useEffect(() => {
    setBulkDownloadButtonTempTooltip(null);
  }, [selectedIds]);

  const setupWorkflowConfigs = () => {
    configForWorkflow = {
      [WORKFLOWS.AMR.value]: {
        singlularDisplay: WORKFLOWS.AMR.label.toLowerCase(),
        pluralDisplay: WORKFLOWS.AMR.pluralizedLabel.toLowerCase(),
      },
      [WORKFLOWS.CONSENSUS_GENOME.value]: {
        singlularDisplay: WORKFLOWS.CONSENSUS_GENOME.label.toLowerCase(),
        pluralDisplay: WORKFLOWS.CONSENSUS_GENOME.pluralizedLabel.toLowerCase(),
      },
      [WORKFLOWS.SHORT_READ_MNGS.value]: {
        singlularDisplay: "sample",
        pluralDisplay: "samples",
      },
      [WORKFLOWS.LONG_READ_MNGS.value]: {
        singlularDisplay: "sample",
        pluralDisplay: "samples",
      },
    };
  };

  setupWorkflowConfigs();

  const fetchMetadataFieldsBySampleIds = async () => {
    if (selectableIds && showAllMetadata) {
      let metadataFields = [] as MetadataType[];

      if (workflowIsWorkflowRunEntity(workflow)) {
        metadataFields = await getWorkflowRunMetadataFields(selectableIds);
      } else {
        metadataFields = await getSampleMetadataFields(selectableIds);
      }
      setMetadataFields(metadataFields);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetadataFieldsBySampleIds();
  }, []);

  const handleSelectRow = (
    value: number,
    checked: boolean,
    event: { shiftKey: boolean },
  ) => {
    // If the user is holding shift, we want to select all the rows between the last selected row and the current row.
    const newSelected = new Set(selectedIds);
    if (event.shiftKey && referenceSelectId) {
      const ids = objects.getIntermediateIds({
        id1: referenceSelectId,
        id2: value,
      });
      if (checked) {
        forEach((v: number) => {
          newSelected.add(v);
        }, ids);
      } else {
        forEach((v: number) => {
          newSelected.delete(v);
        }, ids);
      }
    } else {
      // Otherwise, we just want to select the current row.
      if (checked) {
        newSelected.add(value);
      } else {
        newSelected.delete(value);
      }
    }
    setReferenceSelectId(value);

    onUpdateSelectedIds(newSelected);

    trackEvent("SamplesView_row_selected", {
      rowIsChecked: checked,
      rowType: find({ value: workflow }, values(WORKFLOWS)).entity,
      selectedId: value,
      numberOfSelectedIds: newSelected.size,
      workflow,
    });
  };

  const handleSelectAllRows = (checked: boolean) => {
    setReferenceSelectId(null);
    const newSelected = new Set(
      checked
        ? union(Array.from(selectedIds), selectableIds)
        : difference(Array.from(selectedIds), selectableIds),
    );
    onUpdateSelectedIds(newSelected);
  };

  const handleSortColumn = ({
    sortBy,
    sortDirection,
  }: {
    sortBy: string;
    sortDirection: SortDirectionType;
  }) => {
    onSortColumn({ sortBy, sortDirection });
  };

  const isSelectAllChecked = () => {
    return (
      !isEmpty(selectableIds) &&
      isEmpty(difference(selectableIds, Array.from(selectedIds)))
    );
  };

  const renderHeatmapTrigger = () => {
    // Should still show deprecated after feature flag is removed
    // (until we've updated the heatmap)
    const amrHeatmapDeprecatedText = allowedFeatures.includes(AMR_V1_FEATURE)
      ? " (Deprecated)"
      : "";
    const amrHeatmapText = `AMR Heatmap${amrHeatmapDeprecatedText}`;

    const heatmapOptions = [
      { text: "Taxon Heatmap", value: "/visualizations/heatmap" },
      { text: amrHeatmapText, value: "/amr_heatmap" },
    ];

    const disabledToolbarIcon = (subtitle: string) => (
      <ToolbarButtonIcon
        className={cs.action}
        icon="grid"
        popupText="Heatmap"
        popupSubtitle={subtitle}
        disabled
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
              selectedIds.size > TAXON_HEATMAP_MODAL_SAMPLES_MINIMUM &&
              !allowedFeatures.includes(HEATMAP_ELASTICSEARCH_FEATURE)
            ) {
              return (
                <BareDropdown.Item
                  key={option.text}
                  text={option.text}
                  onClick={withAnalytics(
                    () => setHeatmapCreationModalOpen(true),
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
                <RouterLink
                  to={`${option.value}?${params}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={log}
                >
                  <BareDropdown.Item key={option.text} text={option.text} />
                </RouterLink>
              );
            }
          })}
          trigger={
            <ToolbarButtonIcon
              className={cs.action}
              icon="grid"
              popupText="Heatmap"
            />
          }
        />
      );
    }
  };

  const renderPhyloTreeTrigger = () => {
    return (
      <ToolbarButtonIcon
        className={cs.action}
        icon="treeHorizontal"
        popupText="Phylogenetic Tree"
        onClick={withAnalytics(
          () => setPhyloCreationModalOpen(true),
          "SamplesView_phylo-tree-modal-open_clicked",
        )}
      />
    );
  };

  const renderBulkDownloadTrigger = () => {
    return (
      <ToolbarButtonIcon
        className={cs.action}
        icon="download"
        popperDependencies={[bulkDownloadButtonTempTooltip]}
        popupText={bulkDownloadButtonTempTooltip || "Download"}
        popupSubtitle={selectedIds.size === 0 ? "Select at least 1 sample" : ""}
        disabled={selectedIds.size === 0}
        onClick={withAnalytics(
          handleBulkDownloadModalOpen,
          "SamplesView_bulk-download-modal-open_clicked",
          { workflow },
        )}
      />
    );
  };

  const renderCollectionTrigger = () => {
    const targetSamples = objects.loaded;

    return selectedIds.size < 2 ? (
      <ToolbarButtonIcon
        className={cs.action}
        icon="squareOnDashedSquare"
        popupText="Background Model"
        popupSubtitle="Select at least 2 samples"
        disabled
      />
    ) : (
      <CollectionModal
        trigger={
          <ToolbarButtonIcon
            className={cs.action}
            icon="squareOnDashedSquare"
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

  const getSarsCov2Count = () => {
    const selectedObjects = objects.loaded.filter(object =>
      selectedIds.has(object.id),
    );
    const sarsCov2Count = selectedObjects
      .map(object => get(["referenceAccession", "taxonName"], object))
      .reduce((n, taxonName) => {
        return n + (taxonName === SARS_COV_2);
      }, 0);
    return sarsCov2Count;
  };

  const renderNextcladeTrigger = () => {
    const sarsCov2Count = getSarsCov2Count();

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
      <ToolbarButtonIcon
        className={cs.action}
        icon="treeDendogram"
        popupText="Nextclade"
        popupSubtitle={getPopupSubtitle()}
        disabled={sarsCov2Count === 0 || sarsCov2Count > MAX_NEXTCLADE_SAMPLES}
        onClick={withAnalytics(
          () => setNextcladeModalOpen(true),
          "SamplesView_nextclade-modal-open_clicked",
        )}
      />
    );
  };

  const renderGenEpiTrigger = () => {
    const sarsCov2Count = getSarsCov2Count();

    if (!allowedFeatures.includes("genepi")) {
      return;
    }

    const getPopupSubtitle = () => {
      if (sarsCov2Count === 0) {
        return "Select at least 1 SARS-CoV-2 sample";
      } else {
        return "";
      }
    };

    return (
      <ToolbarButtonIcon
        className={cs.action}
        // TODO: this is currently a placeholder icon, replace with GenEpi
        // integration icon once it's created.
        icon="share"
        popupText="Send samples to CZ Gen Epi"
        popupSubtitle={getPopupSubtitle()}
        disabled={sarsCov2Count === 0}
      />
    );
  };

  const renderBulkSamplesActionsMenu = () => {
    if (!allowedFeatures.includes(AMR_V1_FEATURE)) {
      return;
    }

    const selectedObjects = objects.loaded.filter(object =>
      selectedIds.has(object.id),
    );
    const noObjectsSelected = size(selectedObjects) === 0;

    return (
      <BulkSamplesActionsMenu
        disabled={noObjectsSelected}
        handleBulkKickoffAmr={handleBulkKickoffAmr}
      />
    );
  };

  const handleBulkKickoffAmr = async () => {
    const selectedObjects = filter(
      object => selectedIds.has(object.id),
      objects.loaded,
    );
    const amrPipelineEligibility = reduce(
      (result, sample) => {
        if (isNotEligibleForAmrPipeline(sample)) {
          result.ineligible.push(sample);
        } else {
          result.eligible.push(sample);
        }
        return result;
      },
      {
        eligible: [] as PipelineTypeRun[],
        ineligible: [] as PipelineTypeRun[],
      },
      selectedObjects,
    );

    if (size(amrPipelineEligibility.eligible) > 0) {
      const sampleIdsToKickoffAmr = map("id", amrPipelineEligibility.eligible);
      kickoffAmrPipelineForSamples(sampleIdsToKickoffAmr);
      renderAmrPipelineBulkKickedOffNotification();

      trackEvent(
        ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED,
        {
          sampleIds: sampleIdsToKickoffAmr,
        },
      );

      handleNewAmrCreationsFromMngs({
        numAmrRunsCreated: size(amrPipelineEligibility.eligible),
      });

      setRecentlyKickedOffAmrWorkflowRunsForSampleIds(
        prevRecentlyKickedOffAmrWorkflowRunsForSampleIds =>
          new Set([
            ...Array.from(prevRecentlyKickedOffAmrWorkflowRunsForSampleIds),
            ...sampleIdsToKickoffAmr,
          ]),
      );
    }

    if (size(amrPipelineEligibility.ineligible) > 0) {
      const ineligibleSampleNames = map(
        sample => get("sample.name", sample),
        amrPipelineEligibility.ineligible,
      );
      // We need this 10ms delay to allow the first toast to render properly before showing the second toast
      await delay(10);
      renderIneligibleSamplesForBulkKickoffAmrNotification(
        ineligibleSampleNames,
      );
    }
  };

  const isNotEligibleForAmrPipeline = (sample: PipelineTypeRun) => {
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

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const kickoffAmrPipelineForSamples = (sampleIds: number[]) => {
    bulkKickoffWorkflowRuns({
      sampleIds,
      workflow: WORKFLOWS.AMR.value,
    });
  };

  const renderAmrPipelineBulkKickedOffNotification = () => {
    const renderAmrNotification = (onClose: () => void) => (
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

  const renderIneligibleSamplesForBulkKickoffAmrNotification = (
    invalidSampleNames: string[],
  ) => {
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

    const renderAmrNotification = (onClose: () => void) => (
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

  const renderTriggers = () => {
    const triggers = {
      [TRIGGERS.backgroundModel]: renderCollectionTrigger,
      [TRIGGERS.heatmap]: renderHeatmapTrigger,
      [TRIGGERS.phylogeneticTree]: renderPhyloTreeTrigger,
      [TRIGGERS.download]: renderBulkDownloadTrigger,
      [TRIGGERS.nextclade]: renderNextcladeTrigger,
      [TRIGGERS.genepi]: renderGenEpiTrigger,
      [TRIGGERS.bulk_kickoff_amr]: renderBulkSamplesActionsMenu,
    };
    // Get workflows triggers available in the current domain and workflow tab
    const triggersAvailable = intersection(
      WORKFLOW_TRIGGERS_BY_DOMAIN[domain],
      WORKFLOW_TRIGGERS[workflow],
    );
    // @ts-expect-error lodash/fp should return a usable type
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

  const renderToolbar = () => {
    const hideDisplaySwitcher = workflow === WORKFLOWS.LONG_READ_MNGS.value;
    return (
      <div className={cs.samplesToolbar}>
        {!hideDisplaySwitcher && renderDisplaySwitcher()}
        <div className={cs.fluidBlank} />
        {!hideAllTriggers && renderTriggers()}
      </div>
    );
  };

  const renderFilteredCount = () => {
    if (!isEmpty(userDataCounts)) {
      const totalNumberOfObjects =
        userDataCounts.sampleCountByWorkflow[workflow];

      const workflowConfig = configForWorkflow[workflow];

      const workflowDisplayText =
        totalNumberOfObjects === 1
          ? workflowConfig.singlularDisplay
          : workflowConfig.pluralDisplay;

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

  const renderTable = () => {
    if (loading) {
      return (
        <div className={cs.loadingColumns}>
          <IconLoading className={cs.iconLoading} />
        </div>
      );
    }

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
    const selectAllChecked = isSelectAllChecked();
    return (
      <div className={cs.table}>
        <InfiniteTable
          ref={childInfiniteTable => (infiniteTable = childInfiniteTable)}
          columns={columns}
          defaultRowHeight={rowHeight}
          draggableColumns
          initialActiveColumns={activeColumns}
          loadingClassName={csTableRenderer.loading}
          onActiveColumnsChange={onActiveColumnsChange}
          onLoadRows={onLoadRows}
          onSelectAllRows={withAnalytics(
            handleSelectAllRows,
            "SamplesView_select-all-rows_clicked",
          )}
          onSelectRow={handleSelectRow}
          onRowClick={handleRowClick}
          onSortColumn={handleSortColumn}
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

  const renderDisplaySwitcher = () => {
    return (
      <DiscoveryViewToggle
        currentDisplay={currentDisplay}
        onDisplaySwitch={(display: string) => {
          onDisplaySwitch(display);
          trackEvent(`SamplesView_${display}-switch_clicked`);
        }}
        includePLQC={
          !!projectId && workflow === WORKFLOWS.SHORT_READ_MNGS.value
        }
      />
    );
  };

  const renderMap = () => {
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

  const renderQualityControl = () => {
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

  const renderDisplay = () => {
    switch (currentDisplay) {
      case "table":
        return renderTable();
      case "map":
        return renderMap();
      case "plqc":
        return renderQualityControl();
    }
  };

  const handleBulkDownloadModalOpen = () => {
    if (!appConfig.maxObjectsBulkDownload) {
      setBulkDownloadButtonTempTooltip(
        "Unexpected issue. Please contact us for help.",
      );
    } else if (selectedIds.size > appConfig.maxObjectsBulkDownload && !admin) {
      // This check ensures that the # of selected objects does not surpass our max object limit that we allow in bulk downloads.
      // There is a separate check in BulkDownloadModal that looks for a max number of objects allowed and disables the
      // 'original input file download' option if the # of selected objects surpasses that limit.
      const objectToDownload =
        workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
          ? "consensus genomes"
          : "samples";

      setBulkDownloadButtonTempTooltip(
        `No more than ${appConfig.maxObjectsBulkDownload} ${objectToDownload} allowed in one download.`,
      );
    } else {
      setBulkDownloadModalOpen(true);
    }
  };

  const handleBulkDownloadGenerate = () => {
    setBulkDownloadModalOpen(false);
    showBulkDownloadNotification();
  };

  const handleRowClick = ({
    event,
    rowData,
  }: {
    event: React.SyntheticEvent;
    rowData: { id: number };
  }) => {
    const object = objects.get(rowData.id);
    onObjectSelected && onObjectSelected({ object, currentEvent: event });

    trackEvent("SamplesView_row_clicked", {
      sampleId: object.id,
      sampleName: object?.sample?.name,
      workflowEntity,
    });
  };

  return (
    <div className={cs.container}>
      {currentDisplay === "table" || currentDisplay === "plqc" ? (
        !snapshotShareId && renderToolbar()
      ) : (
        <NarrowContainer>{renderToolbar()}</NarrowContainer>
      )}
      {renderFilteredCount()}
      {renderDisplay()}
      {phyloCreationModalOpen && (
        <PhyloTreeCreationModal
          // TODO(tiago): migrate phylo tree to use api (or read csrf from context) and remove this
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
          csrf={document.getElementsByName("csrf-token")[0].content}
          onClose={withAnalytics(
            () => setPhyloCreationModalOpen(false),
            "SamplesView_phylo-tree-modal_closed",
          )}
        />
      )}
      {bulkDownloadModalOpen && (
        <BulkDownloadModal
          open
          onClose={withAnalytics(
            () => setBulkDownloadModalOpen(false),
            "SamplesView_bulk-download-modal_closed",
          )}
          onGenerate={handleBulkDownloadGenerate}
          selectedIds={selectedIds}
          workflow={workflow}
          workflowEntity={workflowEntity}
        />
      )}
      {heatmapCreationModalOpen && (
        <HeatmapCreationModal
          open
          onClose={withAnalytics(
            () => setHeatmapCreationModalOpen(false),
            ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_HEATMAP_CREATION_MODAL_CLOSED,
          )}
          selectedIds={selectedIds}
        />
      )}
      {nextcladeModalOpen && (
        <NextcladeModal
          open
          onClose={withAnalytics(
            () => setNextcladeModalOpen(false),
            "SamplesView_nextclade-modal_closed",
          )}
          selectedIds={selectedIds}
          workflowEntity={workflowEntity}
        />
      )}
    </div>
  );
});

export default SamplesView;
