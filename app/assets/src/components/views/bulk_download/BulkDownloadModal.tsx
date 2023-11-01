import { get, set, unset } from "lodash/fp";
import memoize from "memoize-one";
import React from "react";
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
import {
  ANALYTICS_EVENT_NAMES,
  trackEventFromClassComponent,
} from "~/api/analytics";
import {
  createBulkDownload,
  getBulkDownloadMetrics,
  getBulkDownloadTypes,
} from "~/api/bulk_downloads";
import { METRIC_OPTIONS } from "~/components/views/compare/SamplesHeatmapView/constants";
import { GlobalContext } from "~/globalContext/reducer";
import { getURLParamString } from "~/helpers/url";
import { Entry } from "~/interface/samplesView";
import { BulkDownloadType } from "~/interface/shared";
import Modal from "~ui/containers/Modal";
import { openUrlInNewTab } from "~utils/links";
import { WorkflowType, WORKFLOW_ENTITIES } from "~utils/workflows";
import cs from "./bulk_download_modal.scss";
import BulkDownloadModalFooter from "./BulkDownloadModalFooter";
import BulkDownloadModalOptions from "./BulkDownloadModalOptions";
import { DEFAULT_BACKGROUND_MODEL, WORKFLOW_OBJECT_LABELS } from "./constants";

const DEFAULT_CREATION_ERROR =
  "An unknown error occurred. Please contact us for help.";

const assembleSelectedDownload = memoize(
  (
    selectedDownloadTypeName,
    allSelectedFields,
    allSelectedFieldsDisplay,
    objectIds,
    workflow,
    workflowEntity,
  ) => {
    const fieldValues = get(selectedDownloadTypeName, allSelectedFields);
    const fieldDisplayNames = get(
      selectedDownloadTypeName,
      allSelectedFieldsDisplay,
    );

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

interface BulkDownloadModalState {
  bulkDownloadTypes: BulkDownloadType[] | null;
  selectedFields: Record<string, string>;
  selectedFieldsDisplay: Record<string, $TSFixMeUnknown>;
  selectedDownloadTypeName: string | null;
  validObjectIds: Set<$TSFixMeUnknown>;
  invalidSampleNames: string[];
  validationError: string | null;
  backgroundOptions: $TSFixMeUnknown[];
  metricsOptions: $TSFixMeUnknown[];
  allObjectsUploadedByCurrentUser: boolean;
  loading: boolean;
  waitingForCreate: boolean;
  createStatus: string | null;
  createError: string | null;
  userIsCollaboratorOnAllSamples: boolean;
}

class BulkDownloadModal extends React.Component<BulkDownloadModalProps> {
  state: BulkDownloadModalState = {
    bulkDownloadTypes: null,
    // We save the fields for ALL download types.
    // If the user clicks between different download types, all their selections are saved.
    selectedFields: {},
    // For each selected field, we also save a human-readable "display name" for that field.
    // While the user is in the choose step, we store a field's value and display name separately.
    // This is to be compatible with <Dropdowns>, which only accept a string or number as the value
    // (as opposed to an object).
    // However, after the selected download is "assembled", both the value and display name for each field are stored
    // in the params. This is also how the bulk download is stored in the database.
    selectedFieldsDisplay: {},
    selectedDownloadTypeName: null,
    validObjectIds: new Set(),
    invalidSampleNames: [],
    validationError: null,
    backgroundOptions: null,
    metricsOptions: null,
    allObjectsUploadedByCurrentUser: false,
    loading: true,
    waitingForCreate: false,
    createStatus: null,
    createError: null,
    userIsCollaboratorOnAllSamples: false,
  };
  static contextType = GlobalContext;

  componentDidMount() {
    this.fetchSampleOptionsAndValidateSelectedSamples();
    this.fetchBackgroundAvailability();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedIds !== this.props.selectedIds) {
      this.fetchBackgroundAvailability();
    }
  }

  // *** Async requests ***

  async fetchSampleOptionsAndValidateSelectedSamples() {
    const { selectedIds, workflow } = this.props;
    let {
      selectedFields: newSelectedFields,
      selectedFieldsDisplay: newSelectedFieldsDisplay,
    } = this.state;

    const bulkDownloadTypesRequest = getBulkDownloadTypes(workflow);
    const validationInfoRequest = this.fetchValidationInfo({
      ids: Array.from(selectedIds),
      workflow,
    });
    const backgroundOptionsRequest = this.fetchBackgrounds();
    const metricsOptionsRequest = getBulkDownloadMetrics(workflow);
    const allObjectsUploadedByCurrentUserRequest =
      this.checkAllObjectsUploadedByCurrentUser();
    const userIsCollaboratorOnAllSamplesRequest =
      this.checkUserIsCollaboratorOnAllSamples();

    const [
      bulkDownloadTypes,
      { validIds, invalidSampleNames, error: validationError },
      backgroundOptions,
      metricsOptions,
      allObjectsUploadedByCurrentUser,
      userIsCollaborator,
    ] = await Promise.all([
      bulkDownloadTypesRequest,
      validationInfoRequest,
      backgroundOptionsRequest,
      metricsOptionsRequest,
      allObjectsUploadedByCurrentUserRequest,
      userIsCollaboratorOnAllSamplesRequest,
    ]);

    // Set any default bulk download field values.
    bulkDownloadTypes.forEach(type => {
      if (type.fields) {
        type.fields.forEach(field => {
          if (field.default_value) {
            newSelectedFields = set(
              [type.type, field.type],
              field.default_value.value,
              newSelectedFields,
            );
            newSelectedFieldsDisplay = set(
              [type.type, field.type],
              field.default_value.display_name,
              newSelectedFieldsDisplay,
            );
          }
        });
      }
    });

    this.setState({
      bulkDownloadTypes,
      validObjectIds: new Set(validIds),
      invalidSampleNames,
      validationError,
      backgroundOptions,
      metricsOptions,
      allObjectsUploadedByCurrentUser,
      selectedFields: newSelectedFields,
      selectedFieldsDisplay: newSelectedFieldsDisplay,
      loading: false,
      userIsCollaboratorOnAllSamples: userIsCollaborator,
    });
  }

  async fetchValidationInfo({ ids, workflow }) {
    const { workflowEntity } = this.props;

    return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
      ? validateWorkflowRunIds({
          workflowRunIds: ids,
          workflow,
        })
      : validateSampleIds({
          sampleIds: ids,
          workflow,
        });
  }

  // TODO(mark): Set a reasonable default background based on the samples and the user's preferences.
  async fetchBackgrounds() {
    const { backgrounds } = await getBackgrounds();

    return backgrounds.map((background: $TSFixMe) => ({
      text: background.name,
      value: background.id,
      mass_normalized: background.mass_normalized,
    }));
  }

  async fetchBackgroundAvailability() {
    const { selectedIds } = this.props;
    const { massNormalizedBackgroundsAvailable } =
      await getMassNormalizedBackgroundAvailability(Array.from(selectedIds));

    this.setState({
      enableMassNormalizedBackgrounds: massNormalizedBackgroundsAvailable,
    });
  }

  async checkAllObjectsUploadedByCurrentUser() {
    const { selectedIds, workflowEntity } = this.props;

    return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
      ? workflowRunsCreatedByCurrentUser(Array.from(selectedIds))
      : samplesUploadedByCurrentUser(Array.from(selectedIds));
  }

  checkUserIsCollaboratorOnAllSamples = () => {
    const { selectedIds, workflowEntity } = this.props;

    return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
      ? false
      : userIsCollaboratorOnAllSamples(Array.from(selectedIds));
  };

  // *** Callbacks ***

  handleDownloadRequest = (sampleIds: number[]) => {
    const { workflow, workflowEntity } = this.props;
    const { selectedDownloadTypeName, selectedFields, selectedFieldsDisplay } =
      this.state;

    const selectedDownload = assembleSelectedDownload(
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      sampleIds,
      workflow,
      workflowEntity,
    );

    this.createBulkDownload(selectedDownload);
  };

  handleSelectDownloadType = (newSelectedDownloadTypeName: string) => {
    const { selectedDownloadTypeName } = this.state;
    if (newSelectedDownloadTypeName === selectedDownloadTypeName) {
      return;
    }

    this.setState({
      selectedDownloadTypeName: newSelectedDownloadTypeName,
    });
  };

  handleHeatmapLink = () => {
    const { selectedFields, validObjectIds } = this.state;
    const metricList = selectedFields?.["biom_format"]?.["filter_by"];
    const metric = selectedFields?.["biom_format"]?.["metric"];
    const sortMetric = METRIC_OPTIONS.includes(metric); // check heatmap is sortable on selected metric
    const presets = [];

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

  handleFieldSelect = (
    downloadType: string,
    fieldType: string,
    value: $TSFixMe,
    displayName: string,
  ) => {
    this.setState(prevState => {
      // If the value is undefined, delete it from selectedFields.
      // This allows us to support cases where certain fields are conditionally required;
      // if the field becomes no longer required, we can unset it.
      const newSelectedFields =
        value !== undefined
          ? // @ts-expect-error Property 'selectedFields' does not exist on type 'Readonly<{}>
            set([downloadType, fieldType], value, prevState.selectedFields)
          : // @ts-expect-error Property 'selectedFields' does not exist on type 'Readonly<{}>
            unset([downloadType, fieldType], prevState.selectedFields);

      const newSelectedFieldsDisplay =
        displayName !== undefined
          ? set(
              [downloadType, fieldType],
              displayName,
              // @ts-expect-error Property 'selectedFields' does not exist on type 'Readonly<{}>
              prevState.selectedFieldsDisplay,
            )
          : // @ts-expect-error Property 'selectedFields' does not exist on type 'Readonly<{}>
            unset([downloadType, fieldType], prevState.selectedFieldsDisplay);

      return {
        selectedFields: newSelectedFields,
        selectedFieldsDisplay: newSelectedFieldsDisplay,
      };
    });
  };

  // *** Create bulk download and close modal ***

  createBulkDownload = async (selectedDownload: $TSFixMe) => {
    const { onGenerate, workflow, workflowEntity } = this.props;
    const { discoveryProjectIds } = this.context;
    const globalAnalyticsContext = {
      projectIds: discoveryProjectIds,
    };

    let objectIds;

    if (workflowEntity === WORKFLOW_ENTITIES.SAMPLES) {
      objectIds = { sampleIds: selectedDownload.validObjectIds };
    } else if (workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS) {
      objectIds = { workflowRunIds: selectedDownload.validObjectIds };
    }

    this.setState({
      waitingForCreate: true,
    });
    try {
      await createBulkDownload(selectedDownload);
    } catch (e) {
      this.setState({
        waitingForCreate: false,
        createStatus: "error",
        createError: e.error || DEFAULT_CREATION_ERROR,
      });
      return;
    }

    trackEventFromClassComponent(
      globalAnalyticsContext,
      ANALYTICS_EVENT_NAMES.BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESSFUL,
      {
        workflow,
        downloadType: selectedDownload.downloadType,
        ...objectIds,
      },
    );

    onGenerate();
  };

  render() {
    const { open, onClose, selectedObjects, workflow } = this.props;
    const {
      bulkDownloadTypes,
      validObjectIds,
      invalidSampleNames,
      validationError,
      backgroundOptions,
      metricsOptions,
      allObjectsUploadedByCurrentUser,
      selectedDownloadTypeName,
      selectedFields,
      waitingForCreate,
      createStatus,
      createError,
      // @ts-expect-error Property 'enableMassNormalizedBackgrounds' does not exist on type
      enableMassNormalizedBackgrounds,
    } = this.state;

    const numObjects = validObjectIds.size;
    const objectDownloaded = WORKFLOW_OBJECT_LABELS[workflow];
    const sampleHostGenomes = selectedObjects
      .filter(obj => validObjectIds.has(obj.id))
      .reduce((result, obj) => {
        result.push({
          id: obj.id,
          name: obj.sample.name,
          hostGenome: obj.host,
        });
        return result;
      }, []);

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
              allObjectsUploadedByCurrentUser={allObjectsUploadedByCurrentUser}
              onFieldSelect={this.handleFieldSelect}
              selectedFields={selectedFields}
              selectedDownloadTypeName={selectedDownloadTypeName}
              onSelect={this.handleSelectDownloadType}
              handleHeatmapLink={this.handleHeatmapLink}
              enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
              objectDownloaded={objectDownloaded}
              userIsCollaborator={this.state.userIsCollaboratorOnAllSamples}
            />
          </div>
          <div className={cs.footer}>
            <BulkDownloadModalFooter
              loading={!bulkDownloadTypes}
              downloadTypes={bulkDownloadTypes}
              validObjectIds={validObjectIds}
              invalidSampleNames={invalidSampleNames}
              validationError={validationError}
              waitingForCreate={waitingForCreate}
              createStatus={createStatus}
              createError={createError}
              sampleHostGenomes={sampleHostGenomes}
              selectedFields={selectedFields}
              selectedDownloadTypeName={selectedDownloadTypeName}
              onDownloadRequest={(sampleIds: number[]) =>
                this.handleDownloadRequest(sampleIds)
              }
              workflow={workflow}
            />
          </div>
        </div>
      </Modal>
    );
  }
}

export default BulkDownloadModal;
