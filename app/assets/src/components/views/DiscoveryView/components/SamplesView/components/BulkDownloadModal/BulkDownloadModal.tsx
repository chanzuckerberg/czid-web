import { set } from "lodash/fp";
import React, { useContext, useEffect, useState } from "react";
import { useMutation, useRelayEnvironment } from "react-relay";
import { fetchQuery, graphql } from "relay-runtime";
import { getMassNormalizedBackgroundAvailability } from "~/api";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import {
  createBulkDownload,
  createSampleMetadataBulkDownload,
  getBulkDownloadMetrics,
  getBulkDownloadTypes,
} from "~/api/bulk_downloads";
import { getCsrfToken } from "~/api/utils";
import { UserContext } from "~/components/common/UserContext";
import Modal from "~/components/ui/containers/Modal";
import { downloadFileFromCSV, openUrlInNewTab } from "~/components/utils/links";
import { WorkflowType, WORKFLOW_ENTITIES } from "~/components/utils/workflows";
import {
  DEFAULT_BACKGROUND_MODEL,
  WORKFLOW_OBJECT_LABELS,
} from "~/components/views/BulkDownloadListView/constants";
import { METRIC_OPTIONS } from "~/components/views/SamplesHeatmapView/constants";
import { getURLParamString } from "~/helpers/url";
import { Entry } from "~/interface/samplesView";
import { BulkDownloadType } from "~/interface/shared";
import cs from "./bulk_download_modal.scss";
import { BulkDownloadModalFooter } from "./components/BulkDownloadModalFooter";
import { BulkDownloadModalOptions } from "./components/BulkDownloadModalOptions";
import {
  BackgroundOptionType,
  MetricsOptionType,
  SelectedDownloadType,
  SelectedFieldsType,
  SelectedFieldValueType,
} from "./types";
import {
  assembleSelectedDownload,
  checkUserIsCollaboratorOnAllSamples,
  DEFAULT_CREATION_ERROR,
  fetchBackgrounds,
} from "./utils";
import { BulkDownloadModalConfig } from "./workflowTypeConfig";
import { BulkDownloadModalMutation as BulkDownloadModalMutationType } from "./__generated__/BulkDownloadModalMutation.graphql";
import { BulkDownloadModalQuery as BulkDownloadModalQueryType } from "./__generated__/BulkDownloadModalQuery.graphql";

const BulkDownloadModalQuery = graphql`
  query BulkDownloadModalQuery(
    $workflowRunIdsStrings: [String]
    $includeMetadata: Boolean!
    $downloadType: String!
    $workflow: String!
    $authenticityToken: String!
  ) {
    BulkDownloadCGOverview(
      input: {
        workflowRunIdsStrings: $workflowRunIdsStrings
        includeMetadata: $includeMetadata
        downloadType: $downloadType
        workflow: $workflow
        authenticityToken: $authenticityToken
      }
    ) {
      cgOverviewRows
    }
  }
`;

const BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery = graphql`
  query BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery(
    $workflowRunIds: [String]
    $authenticityToken: String
  ) {
    fedWorkflowRuns(
      input: {
        where: { id: { _in: $workflowRunIds } }
        todoRemove: { authenticityToken: $authenticityToken }
      }
    ) {
      id
      ownerUserId
      status
    }
  }
`;

const BulkDownloadModalMutation = graphql`
  mutation BulkDownloadModalMutation(
    $workflowRunIdsStrings: [String]
    $downloadFormat: String
    $downloadType: String!
    $workflow: String!
    $authenticityToken: String!
  ) {
    createAsyncBulkDownload(
      input: {
        workflowRunIdsStrings: $workflowRunIdsStrings
        downloadFormat: $downloadFormat
        downloadType: $downloadType
        workflow: $workflow
        authenticityToken: $authenticityToken
      }
    ) {
      id
    }
  }
`;

interface BulkDownloadModalProps {
  onClose: $TSFixMeFunction;
  open?: boolean;
  selectedObjects: Entry[];
  selectedIds?: Set<string>;
  // called when a bulk download has successfully been kicked off
  onGenerate: $TSFixMeFunction;
  workflow: WorkflowType;
  workflowEntity?: string;
}

export const BulkDownloadModal = ({
  onClose,
  open,
  selectedObjects,
  selectedIds,
  onGenerate,
  workflow,
  workflowEntity,
}: BulkDownloadModalProps) => {
  const userContext = useContext(UserContext);
  // *** State ***
  const [bulkDownloadTypes, setBulkDownloadTypes] = useState<
    BulkDownloadType[] | null
  >(null);
  // We save the fields for ALL download types.
  // If the user clicks between different download types, all their selections are saved.
  const [selectedFields, setSelectedFields] = useState<SelectedFieldsType>({});
  // For each selected field, we also save a human-readable "display name" for that field.
  // While the user is in the choose step, we store a field's value and display name separately.
  // This is to be compatible with <Dropdowns>, which only accept a string or number as the value
  // (as opposed to an object).
  // However, after the selected download is "assembled", both the value and display name for each field are stored
  // in the params. This is also how the bulk download is stored in the database.
  const [selectedFieldsDisplay, setSelectedFieldsDisplay] = useState<
    Record<string, $TSFixMeUnknown>
  >({});
  const [selectedDownloadTypeName, setSelectedDownloadTypeName] = useState<
    string | null
  >(null);
  const [validObjectIds, setValidObjectIds] = useState<Set<string>>(new Set());
  const [invalidSampleNames, setInvalidSampleNames] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [backgroundOptions, setBackgroundOptions] = useState<
    BackgroundOptionType[] | null
  >(null);
  const [metricsOptions, setMetricsOptions] = useState<
    MetricsOptionType[] | null
  >(null);
  const [
    areAllRequestedObjectsUploadedByCurrentUser,
    setAreAllRequestedObjectsUploadedByCurrentUser,
  ] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWaitingForCreate, setIsWaitingForCreate] = useState<boolean>(false);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [
    isUserCollaboratorOnAllRequestedSamples,
    setIsUserCollaboratorOnAllRequestedSamples,
  ] = useState<boolean>(false);
  const [
    shouldEnableMassNormalizedBackgrounds,
    setShouldEnableMassNormalizedBackgrounds,
  ] = useState<boolean | undefined>(undefined);

  // *** Relay Hooks ***
  const [commitMutation] = useMutation<BulkDownloadModalMutationType>(
    BulkDownloadModalMutation,
  );
  const kickOffBulkDownload = ({
    workflowRunIdsStrings,
    downloadFormat,
    downloadType,
    workflow,
    authenticityToken,
  }) => {
    commitMutation({
      variables: {
        workflowRunIdsStrings,
        downloadFormat,
        downloadType,
        workflow,
        authenticityToken,
      },
      onCompleted: data => {
        if (data.createAsyncBulkDownload?.id != null) {
          onGenerate();
        } else {
          onCreateDownloadError(DEFAULT_CREATION_ERROR);
        }
      },
      onError: error => {
        console.error(error);
        onCreateDownloadError(DEFAULT_CREATION_ERROR);
      },
    });
  };

  const environment = useRelayEnvironment();
  const downloadCgOverview = ({
    workflowRunIds,
    workflow,
    includeMetadata,
    downloadType,
    authenticityToken,
  }) => {
    fetchQuery<BulkDownloadModalQueryType>(
      environment,
      BulkDownloadModalQuery,
      {
        workflowRunIdsStrings: workflowRunIds,
        includeMetadata: includeMetadata,
        downloadType: downloadType,
        workflow: workflow,
        authenticityToken: authenticityToken,
      },
    ).subscribe({
      next: data => {
        if (data?.BulkDownloadCGOverview?.cgOverviewRows) {
          try {
            downloadFileFromCSV(
              data?.BulkDownloadCGOverview?.cgOverviewRows,
              "consensus_genome_overview",
            );
          } catch (e) {
            console.error(e);
          }
          onClose();
        } else {
          onCreateDownloadError(DEFAULT_CREATION_ERROR);
        }
      },
      error: (error: Error) => {
        onCreateDownloadError(error.message || DEFAULT_CREATION_ERROR);
      },
    });
  };

  async function downloadSampleMetadata(sampleIds: string[]) {
    const sampleMetadataResponse = await createSampleMetadataBulkDownload(
      sampleIds,
    );
    const metadata = sampleMetadataResponse.sample_metadata;
    if (metadata) {
      try {
        downloadFileFromCSV(metadata, "sample_metadata");
      } catch (e) {
        console.error(e);
        onCreateDownloadError(e || DEFAULT_CREATION_ERROR);
      }
      onClose();
    } else {
      console.error(sampleMetadataResponse.error);
      onCreateDownloadError(
        sampleMetadataResponse.error || DEFAULT_CREATION_ERROR,
      );
    }
  }

  // *** Async requests ***
  async function fetchSampleOptionsAndValidateSelectedSamples({
    entityIds,
    workflowEntity,
    workflow,
    selectedFields,
    selectedFieldsDisplay,
  }: {
    entityIds?: Set<string>;
    workflowEntity?: string;
    workflow: WorkflowType;
    selectedFields: SelectedFieldsType;
    selectedFieldsDisplay: Record<string, $TSFixMeUnknown>;
  }): Promise<void> {
    let newSelectedFields = JSON.parse(JSON.stringify(selectedFields));
    let newSelectedFieldsDisplay = JSON.parse(
      JSON.stringify(selectedFieldsDisplay),
    );

    const bulkDownloadTypesRequest = getBulkDownloadTypes(workflow);
    const validationInfoRequest = BulkDownloadModalConfig[
      workflow
    ].fetchValidationInfoFunction({
      entityIds,
      environment,
      BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery,
      authenticityToken: getCsrfToken(),
      workflow,
      workflowEntity,
    });
    const backgroundOptionsRequest = fetchBackgrounds();
    const metricsOptionsRequest = getBulkDownloadMetrics(workflow);

    const areAllRequestedObjectsUploadedByCurrentUserRequest =
      BulkDownloadModalConfig[workflow].fetchAreAllObjectsUploadedByCurrentUser(
        Array.from(entityIds ?? []),
      );

    const isUserCollaboratorOnAllRequestedSamplesRequest =
      checkUserIsCollaboratorOnAllSamples({ entityIds, workflowEntity });

    const [
      bulkDownloadTypes,
      validationInfo,
      backgroundOptions,
      metricsOptions,
      areAllRequestedObjectsUploadedByCurrentUser,
      isUserCollaboratorOnAllRequestedSamples,
    ] = await Promise.all([
      bulkDownloadTypesRequest,
      validationInfoRequest,
      backgroundOptionsRequest,
      metricsOptionsRequest,
      areAllRequestedObjectsUploadedByCurrentUserRequest,
      isUserCollaboratorOnAllRequestedSamplesRequest,
    ]);

    // Set any default bulk download field values.
    bulkDownloadTypes.forEach(type => {
      if (type.fields) {
        type.fields.forEach(field => {
          if (field.default_value) {
            newSelectedFields = set(
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
              [type.type, field.type],
              field.default_value.value,
              newSelectedFields,
            );
            newSelectedFieldsDisplay = set(
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
              [type.type, field.type],
              field.default_value.display_name,
              newSelectedFieldsDisplay,
            );
          }
        });
      }
    });

    // Parse the validation info - this is different for rails vs. nextgen
    const { validIds, invalidSampleNames, validationError } =
      BulkDownloadModalConfig[workflow].validationParser(
        validationInfo,
        selectedObjects,
      );

    // Check if the user is the owner of all the requested objects - this is different for rails vs. nextgen
    const isUserOwnerOfAllObjects = BulkDownloadModalConfig[
      workflow
    ].isUserOwnerParser(
      validationInfo,
      userContext?.userId,
      areAllRequestedObjectsUploadedByCurrentUser,
    );

    setBulkDownloadTypes(bulkDownloadTypes);
    setValidObjectIds(new Set(validIds));
    setInvalidSampleNames(invalidSampleNames ?? []);
    setValidationError(validationError ?? null);
    setBackgroundOptions(backgroundOptions);
    setMetricsOptions(metricsOptions);
    setAreAllRequestedObjectsUploadedByCurrentUser(isUserOwnerOfAllObjects);
    setSelectedFields(newSelectedFields);
    setSelectedFieldsDisplay(newSelectedFieldsDisplay);
    setIsLoading(false);
    setIsUserCollaboratorOnAllRequestedSamples(
      isUserCollaboratorOnAllRequestedSamples,
    );
  }

  async function fetchBackgroundAvailability(selectedIds?: Set<string>) {
    if (!selectedIds) {
      return;
    }

    const { massNormalizedBackgroundsAvailable } =
      await getMassNormalizedBackgroundAvailability(Array.from(selectedIds));

    setShouldEnableMassNormalizedBackgrounds(
      massNormalizedBackgroundsAvailable,
    );
  }

  const trackEvent = useTrackEvent();
  async function createAndTrackBulkDownload({
    selectedDownload,
    workflow,
    workflowEntity,
  }: {
    selectedDownload: SelectedDownloadType;
    workflow: WorkflowType;
    workflowEntity?: string;
  }) {
    let objectIds;

    if (workflowEntity === WORKFLOW_ENTITIES.SAMPLES) {
      objectIds = { sampleIds: selectedDownload.validObjectIds };
    } else if (workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS) {
      objectIds = { workflowRunIds: selectedDownload.validObjectIds };
    }

    setIsWaitingForCreate(true);

    // choose the correct download action based on the download type
    if (
      selectedDownload.downloadType === "consensus_genome" ||
      selectedDownload.downloadType ===
        "consensus_genome_intermediate_output_files"
    ) {
      kickOffBulkDownload({
        workflowRunIdsStrings: selectedDownload.validObjectIds,
        downloadFormat: selectedDownload?.fields?.download_format?.value,
        downloadType: selectedDownload.downloadType,
        workflow: workflow,
        authenticityToken: getCsrfToken(),
      });
    } else if (selectedDownload.downloadType === "consensus_genome_overview") {
      downloadCgOverview({
        workflowRunIds: selectedDownload.validObjectIds,
        includeMetadata: selectedDownload?.fields?.include_metadata?.value,
        downloadType: selectedDownload.downloadType,
        workflow: workflow,
        authenticityToken: getCsrfToken(),
      });
    } else if (selectedDownload.downloadType === "sample_metadata") {
      const railsSampleIds = BulkDownloadModalConfig[
        workflow
      ].getRailsSampleIds(selectedObjects, validObjectIds);
      downloadSampleMetadata(railsSampleIds);
    } else {
      try {
        await createBulkDownload(selectedDownload);
      } catch (e) {
        console.error(e);
        onCreateDownloadError(e.error);
        return;
      }

      trackEvent(
        ANALYTICS_EVENT_NAMES.BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESSFUL,
        {
          workflow,
          downloadType: selectedDownload.downloadType,
          ...objectIds,
        },
      );

      onGenerate();
    }
  }

  const onCreateDownloadError = (error: string) => {
    setIsWaitingForCreate(false);
    setCreateStatus("error");
    setCreateError(error || DEFAULT_CREATION_ERROR);
  };

  // *** Fetching data ***
  // Run once on mount
  useEffect(() => {
    fetchSampleOptionsAndValidateSelectedSamples({
      entityIds: selectedIds,
      workflowEntity,
      workflow,
      selectedFields,
      selectedFieldsDisplay,
    });
    // We want the empty array here so this only runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchBackgroundAvailability(selectedIds);
  }, [selectedIds]);

  // *** Callbacks ***
  const handleDownloadRequest = (sampleIds: number[]) => {
    const selectedDownload = assembleSelectedDownload(
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      sampleIds,
      workflow,
      workflowEntity,
    );

    createAndTrackBulkDownload({ selectedDownload, workflow, workflowEntity });
  };

  const handleSelectDownloadType = (newSelectedDownloadTypeName: string) => {
    if (newSelectedDownloadTypeName === selectedDownloadTypeName) {
      return;
    }
    setCreateStatus(null);
    setCreateError(null);
    setSelectedDownloadTypeName(newSelectedDownloadTypeName);
  };

  const handleHeatmapLink = () => {
    const metricList = selectedFields?.["biom_format"]?.["filter_by"];
    const metric = selectedFields?.["biom_format"]?.["metric"] as string;
    const sortMetric = METRIC_OPTIONS.includes(metric); // check heatmap is sortable on selected metric
    const presets: string[] = [];

    if (metricList) {
      presets.push("thresholdFilters");
    }
    if (sortMetric) {
      presets.push("metric");
    }

    const params = encodeURI(
      getURLParamString({
        background:
          selectedFields?.["biom_format"]?.["background"] ||
          DEFAULT_BACKGROUND_MODEL,
        categories: [],
        subcategories: JSON.stringify({}),
        readSpecificity: null,
        sampleIds: Array.from(validObjectIds),
        species: null,
        thresholdFilters: JSON.stringify(metricList),
        metric: sortMetric,
        presets: presets,
      }),
    );

    openUrlInNewTab(`/visualizations/heatmap?${params}`);
  };

  const handleSelectField = (
    downloadType?: string,
    fieldType?: string,
    value?: SelectedFieldValueType,
    displayName?: string,
  ) => {
    if (!downloadType || !fieldType) return;
    setSelectedFields(prevSelectedFields => {
      const newSelectedFields = JSON.parse(JSON.stringify(prevSelectedFields));
      // If the value is undefined, delete it from selectedFields.
      // This allows us to support cases where certain fields are conditionally required;
      // if the field becomes no longer required, we can unset it.
      if (value !== undefined) {
        if (!newSelectedFields[downloadType]) {
          newSelectedFields[downloadType] = {};
        }
        newSelectedFields[downloadType][fieldType] = value;
      } else {
        if (newSelectedFields[downloadType]) {
          newSelectedFields[downloadType][fieldType] = undefined;
        }
      }
      return newSelectedFields;
    });

    setSelectedFieldsDisplay(prevSelectedFieldsDisplay => {
      const newSelectedFieldsDisplay = JSON.parse(
        JSON.stringify(prevSelectedFieldsDisplay),
      );
      if (displayName !== undefined) {
        if (!newSelectedFieldsDisplay[downloadType]) {
          newSelectedFieldsDisplay[downloadType] = {};
        }
        newSelectedFieldsDisplay[downloadType][fieldType] = displayName;
      } else {
        if (newSelectedFieldsDisplay[downloadType]) {
          newSelectedFieldsDisplay[downloadType][fieldType] = undefined;
        }
      }
      return newSelectedFieldsDisplay;
    });
  };

  const numObjects = selectedIds?.size || validObjectIds.size;
  const objectDownloaded = WORKFLOW_OBJECT_LABELS[workflow];
  const sampleHostGenomes = selectedObjects
    .filter(obj => validObjectIds.has(obj.id))
    .reduce(
      (result, obj) => {
        result.push({
          id: obj.id,
          name: obj.sample.name,
          hostGenome: obj.host,
        });
        return result;
      },
      [] as {
        id: string;
        name: string;
        hostGenome: string;
      }[],
    );

  return (
    <Modal narrow open={open} tall onClose={onClose}>
      <div className={cs.modal}>
        <div className={cs.header}>
          <div className={cs.title}>Select a Download Type</div>
          <div className={cs.tagline}>
            {numObjects} {objectDownloaded}
            {numObjects !== 1 ? "s" : ""} selected
          </div>
        </div>
        <div className={cs.options}>
          <BulkDownloadModalOptions
            areAllObjectsUploadedByCurrentUser={
              areAllRequestedObjectsUploadedByCurrentUser
            }
            backgroundOptions={backgroundOptions}
            downloadTypes={bulkDownloadTypes}
            enableMassNormalizedBackgrounds={
              shouldEnableMassNormalizedBackgrounds
            }
            handleHeatmapLink={handleHeatmapLink}
            isUserCollaboratorOnAllRequestedSamples={
              isUserCollaboratorOnAllRequestedSamples
            }
            metricsOptions={metricsOptions}
            objectDownloaded={objectDownloaded}
            onSelectDownloadType={handleSelectDownloadType}
            onSelectField={handleSelectField}
            selectedFields={selectedFields}
            selectedDownloadTypeName={selectedDownloadTypeName}
            validObjectIds={validObjectIds}
            workflow={workflow}
          />
        </div>
        <div className={cs.footer}>
          <BulkDownloadModalFooter
            loading={isLoading}
            downloadTypes={bulkDownloadTypes}
            validObjectIds={validObjectIds}
            invalidSampleNames={invalidSampleNames}
            validationError={validationError}
            waitingForCreate={isWaitingForCreate}
            createStatus={createStatus}
            createError={createError}
            sampleHostGenomes={sampleHostGenomes}
            selectedFields={selectedFields}
            selectedDownloadTypeName={selectedDownloadTypeName}
            onDownloadRequest={(sampleIds: number[]) =>
              handleDownloadRequest(sampleIds)
            }
            workflow={workflow}
          />
        </div>
      </div>
    </Modal>
  );
};
