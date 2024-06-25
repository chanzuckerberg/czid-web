import { Button } from "@czi-sds/components";
import cx from "classnames";
import {
  difference,
  forEach,
  get,
  intersection,
  isEmpty,
  map,
  reduce,
  size,
} from "lodash/fp";
import React, {
  forwardRef,
  Suspense,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Link as RouterLink } from "react-router-dom";
import { SortDirectionType } from "react-virtualized";
import { benchmarkSamples, bulkKickoffWorkflowRuns } from "~/api";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import {
  getSampleMetadataFields,
  getWorkflowRunMetadataFields,
} from "~/api/metadata";
import { showBulkDownloadNotification } from "~/components/common/BulkDownloadNotification";
import { LoadingPage } from "~/components/common/LoadingPage";
import csTableRenderer from "~/components/common/TableRenderers/table_renderers.scss";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { SHOULD_READ_FROM_NEXTGEN } from "~/components/utils/features";
import {
  AMR_PIPELINE,
  isPipelineFeatureAvailable,
  MINIMUM_VERSIONS,
} from "~/components/utils/pipeline_versions";
import { showToast } from "~/components/utils/toast";
import { DiscoveryMap } from "~/components/views/DiscoveryView/components/DiscoveryMap/DiscoveryMap";
import { DiscoveryViewToggle } from "~/components/views/DiscoveryView/components/DiscoveryViewToggle/DiscoveryViewToggle";
import { BulkDownloadModal } from "~/components/views/DiscoveryView/components/SamplesView/components/BulkDownloadModal";
import CollectionModal from "~/components/views/DiscoveryView/components/SamplesView/components/CollectionModal/CollectionModal";
import { NextcladeModal } from "~/components/views/DiscoveryView/components/SamplesView/components/NextcladeModal";
import PhyloTreeCreationModal from "~/components/views/PhyloTree/PhyloTreeCreationModal";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import { getURLParamString } from "~/helpers/url";
import { CreationSource } from "~/interface/sample";
import {
  Entry,
  PipelineTypeRun,
  SamplesViewHandle,
  SamplesViewProps,
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
  WorkflowType,
  WORKFLOW_ENTITIES,
  WORKFLOW_TABS,
} from "~utils/workflows";
import { DISCOVERY_DOMAIN_PUBLIC } from "../../discovery_api";
import {
  computeColumnsByWorkflow,
  DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW,
  DEFAULT_SORTED_COLUMN_BY_TAB,
} from "./columnConfiguration";
import { BenchmarkModal } from "./components/BenchmarkModal";
import BulkDeleteModal from "./components/BulkDeleteModal";
import { BulkDeleteTrigger } from "./components/BulkDeleteTrigger";
import BulkSamplesActionsMenu from "./components/BulkSamplesActionsMenu/BulkSamplesActionsMenu";
import { FilteredCount } from "./components/FilteredCount";
import QualityControl from "./components/QualityControl";
import ToolbarButtonIcon from "./components/ToolbarButtonIcon/ToolbarButtonIcon";
import {
  PipelineRunStatuses,
  SARS_COV_2,
  TRIGGERS,
  UPLOAD_FAILED,
  WORKFLOW_TRIGGERS,
} from "./constants";
import cs from "./samples_view.scss";
import { getStatusCounts } from "./utils";

const MAX_NEXTCLADE_SAMPLES = 200;
const MAX_TAXON_HEATMAP_SAMPLES = 500;

const SHORT_READ_MNGS_VALUE = WorkflowType.SHORT_READ_MNGS;

/**
 * Upon changing SamplesView from a class to a function component,
 * forwardRef was added to receive a ref from DiscoveryView and
 * use it to define reset() in the useImpertiveHandle hook.
 * https://stackoverflow.com/questions/37949981/call-child-method-from-parent
 * https://beta.reactjs.org/reference/react/forwardRef (01/2023 - smccany)
 */

export const SamplesView = forwardRef(function SamplesView(
  {
    activeColumns = DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW[SHORT_READ_MNGS_VALUE],
    currentDisplay = "table",
    currentTab,
    domain,
    filters,
    filtersSidebarOpen,
    getRows,
    handleNewWorkflowRunsCreated,
    hasAtLeastOneFilterApplied,
    hideAllTriggers,
    mapLevel,
    mapLocationData,
    mapPreviewedLocationId,
    mapTilerKey,
    onActiveColumnsChange,
    onClearFilters,
    onDeleteSample,
    onDisplaySwitch,
    onLoadRows,
    onMapClick,
    onMapLevelChange,
    onMapMarkerClick,
    onMapTooltipTitleClick,
    onObjectSelected,
    onPLQCHistogramBarClick,
    onSortColumn,
    onUpdateSelectedIds,
    projectId,
    protectedColumns = ["sample"],
    sampleStatsSidebarOpen,
    selectableIds,
    selectedIds,
    showAllMetadata,
    snapshotShareId,
    sortable,
    sortBy,
    sortDirection,
    totalWorkflowCounts,
    workflow = WorkflowType.SHORT_READ_MNGS,
    workflowEntity,
  }: SamplesViewProps,
  ref: React.Ref<SamplesViewHandle>,
) {
  const trackEvent = useTrackEvent();
  const userContext = useContext(UserContext);
  const { allowedFeatures, appConfig, admin } = userContext || {};

  // useImperitiveHandle exposes the reset function as a ref to DiscoveryView.
  useImperativeHandle(ref, () => ({
    reset() {
      if (currentDisplay === "table") infiniteTable?.reset();
    },
  }));

  let configForWorkflow: {
    [workflow: string]: {
      singlularDisplay: string;
      pluralDisplay: string;
    };
  };
  let infiniteTable: InfiniteTable;
  const [referenceSelectId, setReferenceSelectId] = useState(null);
  const [phyloCreationModalOpen, setPhyloCreationModalOpen] = useState(false);
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false);
  const [bulkDownloadModalOpen, setBulkDownloadModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] =
    useState<boolean>(false);
  const [nextcladeModalOpen, setNextcladeModalOpen] = useState(false);
  const [metadataFields, setMetadataFields] = useState<
    MetadataType[] | undefined
  >();
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
  const [bulkDownloadButtonTempTooltip, setBulkDownloadButtonTempTooltip] =
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    useState<string>(null);

  useEffect(() => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setBulkDownloadButtonTempTooltip(null);
  }, [selectedIds]);

  const setupWorkflowConfigs = () => {
    configForWorkflow = {
      [WorkflowType.AMR]: {
        singlularDisplay: WORKFLOW_TABS.AMR.toLowerCase(),
        pluralDisplay:
          WORKFLOWS[WorkflowType.AMR].pluralizedLabel.toLowerCase(),
      },
      [WorkflowType.BENCHMARK]: {
        singlularDisplay: WORKFLOW_TABS.BENCHMARK.toLowerCase(),
        pluralDisplay:
          WORKFLOWS[WorkflowType.BENCHMARK].pluralizedLabel.toLowerCase(),
      },
      [WorkflowType.CONSENSUS_GENOME]: {
        singlularDisplay: WORKFLOW_TABS.CONSENSUS_GENOME.toLowerCase(),
        pluralDisplay:
          WORKFLOWS[
            WorkflowType.CONSENSUS_GENOME
          ].pluralizedLabel.toLowerCase(),
      },
      [WorkflowType.SHORT_READ_MNGS]: {
        singlularDisplay: "sample",
        pluralDisplay: "samples",
      },
      [WorkflowType.LONG_READ_MNGS]: {
        singlularDisplay: "sample",
        pluralDisplay: "samples",
      },
    };
  };

  setupWorkflowConfigs();

  const fetchMetadataFieldsBySampleIds = async () => {
    if (!showAllMetadata) {
      setLoading(false);
      return;
    }
    if (metadataFields === undefined && selectableIds !== undefined) {
      let metadataFields = [] as MetadataType[];
      // TODO(bchu): Make CG also hit /samples for NextGen integration. We'll need to give Rails
      // the old Rails IDs.
      if (workflowIsWorkflowRunEntity(workflow)) {
        metadataFields = await getWorkflowRunMetadataFields(selectableIds);
      } else {
        metadataFields = await getSampleMetadataFields(selectableIds);
      }
      setMetadataFields(metadataFields);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadataFieldsBySampleIds();
  }, [selectableIds]);

  const selectedObjects = getRows().filter((row): boolean =>
    Boolean(selectedIds?.has(row.id)),
  );

  const handleSelectRow = (
    value: string,
    checked: boolean,
    event: { shiftKey: boolean },
  ) => {
    // If the user is holding shift, we want to select all the rows between the last selected row and the current row.
    const newSelected = new Set(selectedIds);
    if (event.shiftKey && referenceSelectId) {
      const ids = selectableIds?.slice(
        selectableIds.findIndex(id => id === referenceSelectId || id === value),
        selectableIds.findLastIndex(
          id => id === referenceSelectId || id === value,
        ) + 1,
      );

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
      // Otherwise, we just want to select the current row.
      if (checked) {
        newSelected.add(value);
      } else {
        newSelected.delete(value);
      }
    }
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setReferenceSelectId(value);

    onUpdateSelectedIds(newSelected);
  };

  const handleSelectAllRows = (checked: boolean) => {
    setReferenceSelectId(null);
    onUpdateSelectedIds(checked ? new Set(selectableIds) : new Set());
  };

  const handleSortColumn = ({
    sortBy,
    sortDirection,
  }: {
    sortBy: string;
    sortDirection: SortDirectionType;
  }) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    onSortColumn({ sortBy, sortDirection });
  };

  const onBulkDeleteSuccess = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    const statusCounts = getStatusCounts(selectedObjects, workflowEntity);
    trackEvent(ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_RUNS_BULK_DELETED, {
      workflow: workflow,
      uploadFailedCount: statusCounts[UPLOAD_FAILED],
      succeededCount: statusCounts[PipelineRunStatuses.Complete],
      failedCount: statusCounts[PipelineRunStatuses.Failed],
      projectId: projectId,
    });
    onDeleteSample();
    onUpdateSelectedIds(new Set());
  };

  const isSelectAllChecked = () => {
    return (
      !isEmpty(selectableIds) &&
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
      isEmpty(difference(selectableIds, Array.from(selectedIds)))
    );
  };

  const renderHeatmapTrigger = (popupPosition: ToolbarPopupPositionOptions) => {
    // Should still show deprecated after feature flag is removed
    // (until we've updated the heatmap)
    const amrHeatmapText = "AMR Heatmap (Deprecated)";

    const heatmapOptions = [
      { text: "Taxon Heatmap", value: "/visualizations/heatmap" },
      { text: amrHeatmapText, value: "/amr_heatmap" },
    ];

    const disabledToolbarIcon = (subtitle: string) => (
      <ToolbarButtonIcon
        testId="heatmap-icon"
        className={cs.action}
        icon="grid"
        popupText="Heatmap"
        popupSubtitle={subtitle}
        popupPosition={popupPosition}
        disabled
      />
    );

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (selectedIds.size < 2) {
      return disabledToolbarIcon("Select at least 2 samples");
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
            const params = getURLParamString({
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
              sampleIds: Array.from(selectedIds),
            });
            return (
              <RouterLink
                key={`${option.text}-link`}
                to={`${option.value}?${params}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BareDropdown.Item key={option.text} text={option.text} />
              </RouterLink>
            );
          })}
          trigger={
            <ToolbarButtonIcon
              className={cs.action}
              icon="grid"
              popupText="Heatmap"
              popupPosition={popupPosition}
            />
          }
        />
      );
    }
  };

  const handleClickPhyloTree = () => {
    setPhyloCreationModalOpen(true);
  };

  const handleClickBenchmark = () => {
    setBenchmarkModalOpen(true);
  };

  const renderBulkDownloadTrigger = (
    popupPosition: ToolbarPopupPositionOptions,
  ) => {
    return (
      <ToolbarButtonIcon
        testId="download-icon"
        className={cs.action}
        icon="download"
        popperDependencies={[bulkDownloadButtonTempTooltip]}
        popupText={bulkDownloadButtonTempTooltip || "Download"}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        popupSubtitle={selectedIds.size === 0 ? "Select at least 1 sample" : ""}
        popupPosition={popupPosition}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        disabled={selectedIds.size === 0}
        onClick={handleBulkDownloadModalOpen}
      />
    );
  };

  const renderCollectionTrigger = (
    popupPosition: ToolbarPopupPositionOptions,
  ) => {
    const targetSamples = getRows();

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return selectedIds.size < 2 ? (
      <ToolbarButtonIcon
        testId="background-model-icon"
        className={cs.action}
        icon="squareOnDashedSquare"
        popupText="Background Model"
        popupSubtitle="Select at least 2 samples"
        popupPosition={popupPosition}
        disabled
      />
    ) : (
      <CollectionModal
        allowedFeatures={allowedFeatures}
        trigger={
          <ToolbarButtonIcon
            className={cs.action}
            icon="squareOnDashedSquare"
            popupText="Background Model"
          />
        }
        selectedSampleIds={
          selectedIds !== undefined
            ? // TODO: Make these strings when we migrate MNGS to NextGen.
              // This function is only called in MNGS.
              new Set(Array.from(selectedIds).map(id => Number(id)))
            : undefined
        }
        fetchedSamples={targetSamples.filter(sample =>
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          selectedIds.has(sample.id),
        )}
        workflow={workflow}
      />
    );
  };

  const getSendToNextcladeCount = () => {
    return selectedObjects
      .filter(obj => obj.creation_source !== CreationSource.WGS)
      .map(object => get(["referenceAccession", "taxonName"], object))
      .reduce((n, taxonName) => {
        return n + (taxonName === SARS_COV_2);
      }, 0);
  };

  const renderNextcladeTrigger = (
    popupPosition: ToolbarPopupPositionOptions,
  ) => {
    const shouldReadFromNextGen = allowedFeatures.includes(
      SHOULD_READ_FROM_NEXTGEN,
    );
    const sendToNextcladeCount = getSendToNextcladeCount();

    const getPopupSubtitle = () => {
      // This is a temporary work-around to disable Nextclade until we are able to convert it to NextGen
      if (shouldReadFromNextGen) {
        return "Sending SARS-CoV-2 samples directly to Nexclade is temporarily unavailable.";
      }

      if (sendToNextcladeCount > MAX_NEXTCLADE_SAMPLES) {
        return `Select at most ${MAX_NEXTCLADE_SAMPLES} SARS-CoV-2 samples`;
      } else if (sendToNextcladeCount === 0) {
        return "Select at least 1 SARS-CoV-2 sample that has not been run through the General Viral Consensus Genome analysis pipeline";
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
        popupPosition={popupPosition}
        // TODO: re-enable Nextclade when it's connected to NextGen
        disabled={
          shouldReadFromNextGen
            ? true
            : sendToNextcladeCount === 0 ||
              sendToNextcladeCount > MAX_NEXTCLADE_SAMPLES
        }
        onClick={() => setNextcladeModalOpen(true)}
      />
    );
  };

  const renderGenEpiTrigger = (popupPosition: ToolbarPopupPositionOptions) => {
    const sendToNextcladeCount = getSendToNextcladeCount();

    if (!allowedFeatures.includes("genepi")) {
      return;
    }

    const getPopupSubtitle = () => {
      if (sendToNextcladeCount === 0) {
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
        popupPosition={popupPosition}
        disabled={sendToNextcladeCount === 0}
      />
    );
  };

  const handleBulkKickoffAmr = async () => {
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
      // TODO: Make these strings when we migrate MNGS to NextGen.
      // This function is only called in MNGS.
      const sampleIdsToKickoffAmr = map(
        "id",
        amrPipelineEligibility.eligible,
      ).map(id => Number(id));
      kickoffAmrPipelineForSamples(sampleIdsToKickoffAmr);
      renderAmrPipelineBulkKickedOffNotification();

      trackEvent(
        ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED,
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
          sampleIds: sampleIdsToKickoffAmr,
        },
      );

      trackEvent(
        ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED_ALLISON_TESTING,
        {
          sampleIds: JSON.stringify(sampleIdsToKickoffAmr),
        },
      );

      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
      handleNewWorkflowRunsCreated({
        numWorkflowRunsCreated: size(amrPipelineEligibility.eligible),
        workflow: WorkflowType.AMR,
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
      get(["sample", "workflowRunsCountByWorkflow", WorkflowType.AMR], sample) >
      0;
    // `recentlyKickedOffAmrWorkflowRunsForSampleIds` only gets updated when the user sucessfully
    // kicks off new AMR workflow runs by clicking the BulkKickoffAmr trigger
    const alreadyKickedOffAmrWorkflowRun =
      // TODO: Make these strings when we migrate MNGS to NextGen.
      // This function is only called in MNGS.
      recentlyKickedOffAmrWorkflowRunsForSampleIds.has(Number(sample.id));

    const amrNotAvailableForPipelineVersion = !isPipelineFeatureAvailable(
      AMR_PIPELINE,
      sample.pipelineVersion,
    );

    return (
      failedToUploadSample ||
      nonHostReadsUnavailable ||
      hasExistingAmrWorkflowRunInDatabase ||
      alreadyKickedOffAmrWorkflowRun ||
      amrNotAvailableForPipelineVersion
    );
  };

  const isIneligibleForBenchmark = (sample: Entry) => {
    const failedToUploadSample = !isEmpty(get("sample.uploadError", sample));
    const pipelineRunIncomplete = !(
      get("sample.pipelineRunStatus", sample) === PipelineRunStatuses.Complete
    );

    return failedToUploadSample || pipelineRunIncomplete;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const kickoffAmrPipelineForSamples = (sampleIds: number[]) => {
    bulkKickoffWorkflowRuns({
      sampleIds,
      workflow: WorkflowType.AMR,
    });
  };

  const handleBenchmark = async ({
    samplesToBenchmark,
    fullGroundTruthFilePath = "",
  }: {
    fullGroundTruthFilePath: string;
    samplesToBenchmark: Entry[];
  }) => {
    const benchmarkEligibility = reduce(
      (result, sample) => {
        if (isIneligibleForBenchmark(sample)) {
          result.ineligible.push(sample);
        } else {
          result.eligible.push(sample);
        }
        return result;
      },
      {
        eligible: [] as Entry[],
        ineligible: [] as Entry[],
      },
      samplesToBenchmark,
    );

    if (size(benchmarkEligibility.eligible) > 0) {
      // TODO: Make these strings when we migrate MNGS to NextGen.
      // This function is only called in MNGS.
      const sampleIds = map("id", benchmarkEligibility.eligible).map(id =>
        Number(id),
      );
      kickoffBenchmark({
        sampleIds,
        groundTruthFilePath: fullGroundTruthFilePath,
      });
      renderBenchmarkKickedOffNotification();

      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
      handleNewWorkflowRunsCreated({
        numWorkflowRunsCreated: size(benchmarkEligibility.eligible),
        workflow: WorkflowType.BENCHMARK,
      });
    }

    if (size(benchmarkEligibility.ineligible) > 0) {
      const ineligibleSampleNames = map(
        sample => get("sample.name", sample),
        benchmarkEligibility.ineligible,
      );
      // We need this 10ms delay to allow the first toast to render properly before showing the second toast
      await delay(10);
      renderIneligibleSamplesForBenchmarkNotification(ineligibleSampleNames);
    }
  };

  const kickoffBenchmark = ({
    sampleIds,
    groundTruthFilePath,
  }: {
    sampleIds: number[];
    groundTruthFilePath: string;
  }) => {
    benchmarkSamples({
      sampleIds,
      workflowToBenchmark: workflow,
      groundTruthFile: groundTruthFilePath,
    });
  };

  const renderAmrPipelineBulkKickedOffNotification = () => {
    const renderAmrNotification = (onClose: () => void) => (
      <Notification displayStyle="elevated" type="info" onClose={onClose}>
        <div className={cs.amrNotification}>
          {`We've started running your samples on the Antimicrobial Resistance pipeline. To view your samples, visit the`}{" "}
          {/* TODO: When the user clicks this AMR link, it should switch to the AMR tab */}
          <div className={cs.amrTab}>Antimicrobial Resistance</div> tab.
        </div>
      </Notification>
    );

    showToast(({ closeToast }) => renderAmrNotification(closeToast), {
      autoClose: 12000,
    });
  };

  const renderBenchmarkKickedOffNotification = () => {
    const renderBenchmarkNotification = (onClose: () => void) => (
      <Notification displayStyle="elevated" type="info" onClose={onClose}>
        <div className={cs.amrNotification}>
          {`The Benchmark has been kicked off. To view the benchmarks, visit the`}{" "}
          <div className={cs.amrTab}>Benchmark</div> tab.
        </div>
      </Notification>
    );

    showToast(({ closeToast }) => renderBenchmarkNotification(closeToast), {
      autoClose: 12000,
    });
  };

  const renderIneligibleSamplesForBenchmarkNotification = (
    invalidSampleNames: string[],
  ) => {
    const header = (
      <div>
        <span className={cs.highlight}>
          {invalidSampleNames.length} sample
          {invalidSampleNames.length > 1 ? "s" : ""} won&apos;t be included in
          the
        </span>{" "}
        Benchmark because they either failed or are still processing.
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

    showToast(
      ({ closeToast }) => (
        <AccordionNotification
          header={header}
          content={content}
          open={false}
          type={"warning"}
          displayStyle={"elevated"}
          onClose={closeToast}
        />
      ),
      {
        autoClose: 12000,
      },
    );
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
        {`on the Antimicrobial Resistance pipeline because they either failed, were originally run on mNGS pipeline version less than ${MINIMUM_VERSIONS[AMR_PIPELINE]}, are still processing, or were already run.`}
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

    showToast(
      ({ closeToast }) => (
        <AccordionNotification
          header={header}
          content={content}
          open={false}
          type={"warning"}
          displayStyle={"elevated"}
          onClose={closeToast}
        />
      ),
      {
        autoClose: 12000,
      },
    );
  };

  const renderBulkDeleteTrigger = (
    popupPosition: ToolbarPopupPositionOptions,
  ) => (
    <BulkDeleteTrigger
      onClick={() => setIsBulkDeleteModalOpen(true)}
      selectedObjects={selectedObjects}
      popupPosition={popupPosition}
      workflow={workflow}
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      workflowEntity={workflowEntity}
    />
  );

  const renderBulkSamplesActionsMenu = (
    popupPosition: ToolbarPopupPositionOptions,
  ) => (
    <BulkSamplesActionsMenu
      noObjectsSelected={size(selectedObjects) === 0}
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      handleBulkKickoffAmr={
        domain !== DISCOVERY_DOMAIN_PUBLIC ? handleBulkKickoffAmr : null
      }
      handleClickPhyloTree={handleClickPhyloTree}
      handleClickBenchmark={handleClickBenchmark}
      popupPosition={popupPosition}
    />
  );

  type ToolbarPopupPositionOptions = "top left" | "top center";

  const renderTriggers = () => {
    const triggers = {
      [TRIGGERS.backgroundModel]: (
        popupPosition: ToolbarPopupPositionOptions,
      ) => renderCollectionTrigger(popupPosition),
      [TRIGGERS.heatmap]: (popupPosition: ToolbarPopupPositionOptions) =>
        renderHeatmapTrigger(popupPosition),
      [TRIGGERS.download]: (popupPosition: ToolbarPopupPositionOptions) =>
        renderBulkDownloadTrigger(popupPosition),
      [TRIGGERS.nextclade]: (popupPosition: ToolbarPopupPositionOptions) =>
        renderNextcladeTrigger(popupPosition),
      [TRIGGERS.genepi]: (popupPosition: ToolbarPopupPositionOptions) =>
        renderGenEpiTrigger(popupPosition),
      [TRIGGERS.bulk_delete]: (popupPosition: ToolbarPopupPositionOptions) =>
        renderBulkDeleteTrigger(popupPosition),
      [TRIGGERS.more_actions]: (popupPosition: ToolbarPopupPositionOptions) =>
        renderBulkSamplesActionsMenu(popupPosition),
    };
    // Get workflows triggers available in the current workflow tab
    const triggersAvailable = intersection(
      Object.values(TRIGGERS),
      WORKFLOW_TRIGGERS[workflow],
    );
    const triggersToRender = triggersAvailable.map(
      (trigger: string, i: number) => (
        <React.Fragment key={`${workflow}-${trigger}`}>
          {triggersAvailable.length - 1 === i
            ? triggers[trigger]("top left")
            : triggers[trigger]("top center")}
        </React.Fragment>
      ),
    );

    return (
      <>
        <div className={cs.counterContainer}>
          <Label
            circular
            className={cs.counter}
            // this is broken, but alldoami found it while working on something unrelated
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onClick={() => {}}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            text={`${selectedIds.size}`}
          />
          <span className={cs.label}>Selected</span>
        </div>
        <div className={cs.separator} />
        <div className={cs.actions} data-testid="sample-view-actions">
          {triggersToRender}
        </div>
      </>
    );
  };

  const renderToolbar = () => {
    const hideDisplaySwitcher = workflow === WorkflowType.LONG_READ_MNGS;
    return (
      <div className={cs.samplesToolbar}>
        {!hideDisplaySwitcher && renderDisplaySwitcher()}
        <div className={cs.fluidBlank} />
        {!hideAllTriggers && renderTriggers()}
      </div>
    );
  };

  const renderFilteredCount = () => {
    if (!totalWorkflowCounts) {
      return;
    }

    const totalNumberOfObjects = totalWorkflowCounts[workflow];
    const workflowConfig = configForWorkflow[workflow];

    return (
      <div className={cs.filteredCount} data-testid="sample-count">
        <FilteredCount
          count={
            hasAtLeastOneFilterApplied
              ? {
                  numerator: selectableIds?.length ?? "-",
                  denominator: totalNumberOfObjects,
                }
              : selectableIds?.length ?? "-"
          }
          workflowDisplayText={
            totalNumberOfObjects === 1
              ? workflowConfig.singlularDisplay
              : workflowConfig.pluralDisplay
          }
        />
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
      showSampleOwnerName: allowedFeatures.includes(SHOULD_READ_FROM_NEXTGEN),
    });

    // Note: If the specified sortBy column (ie. a custom metadata field) is not available on this view,
    // we expect the fetched samples to be sorted by the default column and we will bold the default column header.
    // This will not overwrite the sortBy in session storage.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          ref={childInfiniteTable => (infiniteTable = childInfiniteTable)}
          columns={columns}
          defaultRowHeight={rowHeight}
          draggableColumns
          initialActiveColumns={activeColumns}
          loadingClassName={csTableRenderer.loading}
          onActiveColumnsChange={onActiveColumnsChange}
          onLoadRows={onLoadRows}
          onSelectAllRows={handleSelectAllRows}
          onSelectRow={handleSelectRow}
          onRowClick={handleRowClick}
          onSortColumn={handleSortColumn}
          protectedColumns={protectedColumns}
          rowClassName={cs.tableDataRow}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
          onDisplaySwitch(display);
          trackEvent(`SamplesView_${display}-switch_clicked`);
        }}
        includePLQC={!!projectId && workflow === WorkflowType.SHORT_READ_MNGS}
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
    if (projectId) {
      return (
        <Suspense fallback={<LoadingPage />}>
          <QualityControl
            projectId={projectId}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            handleBarClick={onPLQCHistogramBarClick}
            filters={filters}
            filtersSidebarOpen={filtersSidebarOpen}
            sampleStatsSidebarOpen={sampleStatsSidebarOpen}
          />
        </Suspense>
      );
    }
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
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
    event: React.MouseEvent<HTMLDivElement, MouseEvent>;
    rowData: { id: number };
  }) => {
    const object = getRows().find(row => row.id === rowData.id);
    onObjectSelected && onObjectSelected({ object, currentEvent: event });

    trackEvent(ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_ROW_CLICKED, {
      sampleId: object.id,
      sampleName: object?.sample?.name,
      workflowEntity,
    });
  };

  return (
    <div className={cs.container}>
      {currentDisplay === "table" || currentDisplay === "plqc" ? (
        !snapshotShareId && (
          <>
            {renderToolbar()}
            {renderFilteredCount()}
          </>
        )
      ) : (
        <NarrowContainer>
          {renderToolbar()}
          {renderFilteredCount()}
        </NarrowContainer>
      )}
      {renderDisplay()}
      {phyloCreationModalOpen && (
        <PhyloTreeCreationModal
          // TODO(tiago): migrate phylo tree to use api (or read csrf from context) and remove this
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
          csrf={document.getElementsByName("csrf-token")[0].content}
          onClose={() => setPhyloCreationModalOpen(false)}
        />
      )}
      {benchmarkModalOpen && (
        <BenchmarkModal
          onConfirm={({ fullGroundTruthFilePath, samplesToBenchmark }) =>
            handleBenchmark({ fullGroundTruthFilePath, samplesToBenchmark })
          }
          open={benchmarkModalOpen}
          onClose={() => setBenchmarkModalOpen(false)}
          selectedObjects={selectedObjects}
          workflow={workflow}
        />
      )}
      {bulkDownloadModalOpen && (
        <BulkDownloadModal
          open
          onClose={() => setBulkDownloadModalOpen(false)}
          onGenerate={handleBulkDownloadGenerate}
          selectedObjects={selectedObjects}
          selectedIds={selectedIds}
          workflow={workflow}
          workflowEntity={workflowEntity}
        />
      )}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onSuccess={onBulkDeleteSuccess}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
        selectedIds={Array.from(selectedIds)}
        isShortReadMngs={workflow === WorkflowType.SHORT_READ_MNGS}
        workflowLabel={WORKFLOWS[workflow]?.label}
      />
      {nextcladeModalOpen && (
        <NextcladeModal
          isOpen
          onClose={() => setNextcladeModalOpen(false)}
          selectedIds={selectedIds}
        />
      )}
    </div>
  );
});

/** Combined from Workflows and Entities Services. */
export type CgRow = WorkflowRunRow & CgEntityRow;

/**
 * Fields returned by Workflows Service formatted into the legacy processRaw() format (so we can
 * continue to use the old renderers during the migration).
 */
export interface WorkflowRunRow {
  // TODO: Lookup username from Entities via WorkflowRun's ownerUserId (to replicate
  // "sample?.userNameWhoInitiatedWorkflowRun || sample.user" in TableRenderers.tsx). For now just
  // render the sample's user.
  id: string;
  inputSequencingReadId: string;
  inputJson?: { [key: string]: any };
  status?: string;
  createdAt?: string;
  workflow: string;
  wdl_version?: string;
  creation_source?: string;
  referenceAccession?: ReferenceAccession;
}

/**
 * Fields returned by Entities Service (excludes custom metadata).
 *
 * The order of properties follows that of processRawWorkflowRun().
 */
export interface CgEntityRow {
  sequencingReadId: string;
  consensusGenomeProducingRunId?: string;
  sample: {
    id: string;
    railsSampleId?: number;
    name: string;
    project?: string;
    publicAccess?: boolean;
    uploadError?: string;
    userId?: number;
    user?: string;
  };
  host?: string;
  notes?: string;
  medakaModel?: string;
  technology: string;
  wetlabProtocol?: string;
  referenceAccession?: ReferenceAccession;
  coverageDepth?: number;
  totalReadsCG?: number;
  gcPercent?: number;
  refSnps?: number;
  percentIdentity?: number;
  nActg?: number;
  percentGenomeCalled?: number;
  nMissing?: number;
  nAmbiguous?: number;
  referenceAccessionLength?: number;
  collection_location_v2: string;
  nucleotide_type: string;
  sample_type: string;
  water_control?: string;
}

/**
 * Data needed to render the Reference Accession column.
 *
 * This is on both WorkflowRunRow and CgEntityRow b/c for CG runs kicked off from mNGS that have
 * not completed, none of this data is available in Entities Service (SequencingRead's taxon is
 * null and will stay null. No ConsensusGenome has been created yet) so it's pulled from the
 * WorkflowRun's rawInputJson.
 */
export interface ReferenceAccession {
  accessionName?: string;
  referenceAccessionId?: string;
  taxonName?: string;
}

/** Encapsulates custom metadata fields. */
export type Metadata = { [key: string]: NonNullable<any> };
