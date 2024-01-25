import { set, unset } from "lodash/fp";
import memoize from "memoize-one";
import React, { useEffect, useState } from "react";
import {
  getBackgrounds,
  getMassNormalizedBackgroundAvailability,
  samplesUploadedByCurrentUser,
  userIsCollaboratorOnAllSamples,
  workflowRunsCreatedByCurrentUser,
} from "~/api";
import {
  validateSampleIds,
  validateWorkflowRunIds,
} from "~/api/access_control";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import {
  createBulkDownload,
  getBulkDownloadMetrics,
  getBulkDownloadTypes,
} from "~/api/bulk_downloads";
import Modal from "~/components/ui/containers/Modal";
import { openUrlInNewTab } from "~/components/utils/links";
import { WorkflowType, WORKFLOW_ENTITIES } from "~/components/utils/workflows";
import {
  DEFAULT_BACKGROUND_MODEL,
  WORKFLOW_OBJECT_LABELS,
} from "~/components/views/BulkDownloadListView/constants";
import { METRIC_OPTIONS } from "~/components/views/compare/SamplesHeatmapView/constants";
import cs from "~/components/views/samples/SamplesView/components/BulkDownloadModal/bulk_download_modal.scss";
import { getURLParamString } from "~/helpers/url";
import { Entry } from "~/interface/samplesView";
import { Background, BulkDownloadType } from "~/interface/shared";
import { BulkDownloadModalFooter } from "./components/BulkDownloadModalFooter";
import { BulkDownloadModalOptions } from "./components/BulkDownloadModalOptions";

const DEFAULT_CREATION_ERROR =
  "An unknown error occurred. Please contact us for help.";

type SelectedDownloadType = {
  downloadType: string | null;
  fields: Record<
    string,
    {
      value: string;
      displayName: string;
    }
  >;
  validObjectIds: number[];
  workflow: WorkflowType;
  workflowEntity?: string;
};

const assembleSelectedDownload = memoize(
  (
    selectedDownloadTypeName,
    allSelectedFields,
    allSelectedFieldsDisplay,
    objectIds,
    workflow,
    workflowEntity,
  ): SelectedDownloadType => {
    const fieldValues = allSelectedFields?.selectedDownloadTypeName;
    const fieldDisplayNames =
      allSelectedFieldsDisplay?.selectedDownloadTypeName;

    const fields = {};
    if (fieldValues) {
      for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
        fields[fieldName] = {
          value: fieldValue,
          // Use the display name for the value if it exists. Otherwise, use the value.
          displayName: fieldDisplayNames[fieldName] || fieldValue,
        };
      }
    }

    return {
      downloadType: selectedDownloadTypeName,
      fields,
      validObjectIds: Array.from(objectIds),
      workflow,
      workflowEntity,
    };
  },
);

interface BulkDownloadModalProps {
  onClose: $TSFixMeFunction;
  open?: boolean;
  selectedObjects: Entry[];
  selectedIds?: Set<number>;
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
  const [bulkDownloadTypes, setBulkDownloadTypes] = useState<
    BulkDownloadType[] | null
  >(null);
  // We save the fields for ALL download types.
  // If the user clicks between different download types, all their selections are saved.
  const [selectedFields, setSelectedFields] = useState<Record<string, string>>(
    {},
  );
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
  const [validObjectIds, setValidObjectIds] = useState<Set<number | string>>(
    new Set(),
  );
  const [invalidSampleNames, setInvalidSampleNames] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [backgroundOptions, setBackgroundOptions] = useState<
    $TSFixMeUnknown[] | null
  >(null);
  const [metricsOptions, setMetricsOptions] = useState<
    $TSFixMeUnknown[] | null
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

  // *** Async requests ***
  async function fetchValidationInfo({ entityIds, workflow }) {
    if (!entityIds) return null;

    return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
      ? validateWorkflowRunIds({
          workflowRunIds: entityIds,
          workflow,
        })
      : validateSampleIds({
          sampleIds: entityIds,
          workflow,
        });
  }

  async function fetchBackgrounds() {
    const { backgrounds } = await getBackgrounds();
    if (!backgrounds) {
      return [];
    }

    return backgrounds.map((background: Background) => ({
      text: background.name,
      value: background.id,
      mass_normalized: background.mass_normalized,
    }));
  }

  async function checkAllObjectsUploadedByCurrentUser({
    entityIds,
    workflowEntity,
  }) {
    if (!entityIds) {
      return false;
    }

    return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
      ? workflowRunsCreatedByCurrentUser(Array.from(entityIds))
      : samplesUploadedByCurrentUser(Array.from(entityIds));
  }

  async function checkUserIsCollaboratorOnAllSamples({
    entityIds,
    workflowEntity,
  }) {
    if (!entityIds) {
      return false;
    }
    return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
      ? false
      : userIsCollaboratorOnAllSamples(Array.from(entityIds));
  }

  async function fetchSampleOptionsAndValidateSelectedSamples({
    entityIds,
    workflowEntity,
    workflow,
    selectedFields,
    selectedFieldsDisplay,
  }: {
    entityIds?: Set<number>;
    workflowEntity?: string;
    workflow: WorkflowType;
    selectedFields: Record<string, string>;
    selectedFieldsDisplay: Record<string, $TSFixMeUnknown>;
  }): Promise<void> {
    // TODO (ehoops): these should be const and we should fix the updaters below
    let newSelectedFields = { ...selectedFields };
    let newSelectedFieldsDisplay = { ...selectedFieldsDisplay };

    const bulkDownloadTypesRequest = getBulkDownloadTypes(workflow);
    const validationInfoRequest = fetchValidationInfo({
      entityIds: entityIds && Array.from(entityIds),
      workflow,
    });
    const backgroundOptionsRequest = fetchBackgrounds();
    const metricsOptionsRequest = getBulkDownloadMetrics(workflow);
    const areAllRequestedObjectsUploadedByCurrentUserRequest =
      checkAllObjectsUploadedByCurrentUser({ entityIds, workflowEntity });
    const isUserCollaboratorOnAllRequestedSamplesRequest =
      checkUserIsCollaboratorOnAllSamples({ entityIds, workflowEntity });

    const [
      bulkDownloadTypes,
      { validIds, invalidSampleNames, error: validationError },
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
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            newSelectedFields = set(
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
              [type.type, field.type],
              field.default_value.value,
              newSelectedFields,
            );
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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

    setBulkDownloadTypes(bulkDownloadTypes);
    setValidObjectIds(new Set(validIds));
    setInvalidSampleNames(invalidSampleNames);
    setValidationError(validationError);
    setBackgroundOptions(backgroundOptions);
    setMetricsOptions(metricsOptions);
    setAreAllRequestedObjectsUploadedByCurrentUser(
      areAllRequestedObjectsUploadedByCurrentUser,
    );
    setSelectedFields(newSelectedFields);
    setSelectedFieldsDisplay(newSelectedFieldsDisplay);
    setIsLoading(false);
    setIsUserCollaboratorOnAllRequestedSamples(
      isUserCollaboratorOnAllRequestedSamples,
    );
  }

  async function fetchBackgroundAvailability(selectedIds?: Set<number>) {
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
    try {
      await createBulkDownload(selectedDownload);
    } catch (e) {
      setIsWaitingForCreate(false);
      setCreateStatus("error");
      setCreateError(e.error || DEFAULT_CREATION_ERROR);
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
    setSelectedDownloadTypeName(newSelectedDownloadTypeName);
  };

  const handleHeatmapLink = () => {
    const metricList = selectedFields?.["biom_format"]?.["filter_by"];
    const metric = selectedFields?.["biom_format"]?.["metric"];
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

  const handleFieldSelect = (
    downloadType: string,
    fieldType: string,
    value: $TSFixMe,
    displayName: string,
  ) => {
    const newSelectedFields = { ...selectedFields };
    // If the value is undefined, delete it from selectedFields.
    // This allows us to support cases where certain fields are conditionally required;
    // if the field becomes no longer required, we can unset it.
    if (value !== undefined) {
      set([downloadType, fieldType], value, newSelectedFields);
    } else {
      unset([downloadType, fieldType], newSelectedFields);
    }

    const newSelectedFieldsDisplay = { ...selectedFieldsDisplay };
    if (displayName !== undefined) {
      set([downloadType, fieldType], displayName, newSelectedFieldsDisplay);
    } else {
      unset([downloadType, fieldType], newSelectedFieldsDisplay);
    }

    setSelectedFields(newSelectedFields);
    setSelectedFieldsDisplay(newSelectedFieldsDisplay);
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
        id: number;
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
            downloadTypes={bulkDownloadTypes}
            validObjectIds={validObjectIds}
            backgroundOptions={backgroundOptions}
            metricsOptions={metricsOptions}
            allObjectsUploadedByCurrentUser={
              areAllRequestedObjectsUploadedByCurrentUser
            }
            onFieldSelect={handleFieldSelect}
            selectedFields={selectedFields}
            selectedDownloadTypeName={selectedDownloadTypeName}
            onSelect={handleSelectDownloadType}
            handleHeatmapLink={handleHeatmapLink}
            enableMassNormalizedBackgrounds={
              shouldEnableMassNormalizedBackgrounds
            }
            objectDownloaded={objectDownloaded}
            userIsCollaborator={isUserCollaboratorOnAllRequestedSamples}
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
