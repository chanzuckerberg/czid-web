import { unset, get, set } from "lodash/fp";
import memoize from "memoize-one";
import PropTypes from "prop-types";
import React from "react";

import {
  getBackgrounds,
  getMassNormalizedBackgroundAvailability,
  samplesUploadedByCurrentUser,
  getHeatmapMetrics,
  workflowRunsCreatedByCurrentUser,
} from "~/api";
import {
  validateSampleIds,
  validateWorkflowRunIds,
} from "~/api/access_control";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { createBulkDownload, getBulkDownloadTypes } from "~/api/bulk_downloads";
import { METRIC_OPTIONS } from "~/components/views/compare/SamplesHeatmapView/constants";
import { getURLParamString } from "~/helpers/url";
import Modal from "~ui/containers/Modal";
import { openUrlInNewTab } from "~utils/links";
import { WORKFLOWS, WORKFLOW_ENTITIES } from "~utils/workflows";

import BulkDownloadModalFooter from "./BulkDownloadModalFooter";
import BulkDownloadModalOptions from "./BulkDownloadModalOptions";
import cs from "./bulk_download_modal.scss";
import { DEFAULT_BACKGROUND_MODEL } from "./constants";

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
      for (let [fieldName, fieldValue] of Object.entries(fieldValues)) {
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

class BulkDownloadModal extends React.Component {
  state = {
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
  };

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

    // TODO (omar): Remove temporary workflow fix when celaning up dead CG code.
    const tempBulkDownloadWorkflow =
      workflow === WORKFLOWS.SHORT_READ_MNGS.value
        ? workflow
        : WORKFLOWS.CONSENSUS_GENOME.value;
    const bulkDownloadTypesRequest = getBulkDownloadTypes(
      tempBulkDownloadWorkflow,
    );
    const validationInfoRequest = this.fetchValidationInfo({
      ids: Array.from(selectedIds),
      workflow,
    });
    const backgroundOptionsRequest = this.fetchBackgrounds();
    const metricsOptionsRequest = getHeatmapMetrics();
    const allObjectsUploadedByCurrentUserRequest = this.checkAllObjectsUploadedByCurrentUser();

    const [
      bulkDownloadTypes,
      { validIds, invalidSampleNames, error: validationError },
      backgroundOptions,
      metricsOptions,
      allObjectsUploadedByCurrentUser,
    ] = await Promise.all([
      bulkDownloadTypesRequest,
      validationInfoRequest,
      backgroundOptionsRequest,
      metricsOptionsRequest,
      allObjectsUploadedByCurrentUserRequest,
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
    });
  }

  async fetchValidationInfo({ ids, workflow }) {
    const { workflowEntity } = this.props;

    const validationRequest = await (workflowEntity ===
    WORKFLOW_ENTITIES.WORKFLOW_RUNS
      ? validateWorkflowRunIds({
          workflowRunIds: ids,
          workflow: WORKFLOWS.CONSENSUS_GENOME.value,
        })
      : validateSampleIds({
          sampleIds: ids,
          workflow,
        }));

    return validationRequest;
  }

  // TODO(mark): Set a reasonable default background based on the samples and the user's preferences.
  async fetchBackgrounds() {
    const { backgrounds } = await getBackgrounds();

    const backgroundOptions = backgrounds.map(background => ({
      text: background.name,
      value: background.id,
      mass_normalized: background.mass_normalized,
    }));

    return backgroundOptions;
  }

  async fetchBackgroundAvailability() {
    const { selectedIds } = this.props;
    const {
      massNormalizedBackgroundsAvailable,
    } = await getMassNormalizedBackgroundAvailability(Array.from(selectedIds));

    this.setState({
      enableMassNormalizedBackgrounds: massNormalizedBackgroundsAvailable,
    });
  }

  async checkAllObjectsUploadedByCurrentUser() {
    const { selectedIds, workflowEntity } = this.props;

    const validationRequest = await (workflowEntity ===
    WORKFLOW_ENTITIES.WORKFLOW_RUNS
      ? workflowRunsCreatedByCurrentUser(Array.from(selectedIds))
      : samplesUploadedByCurrentUser(Array.from(selectedIds)));

    return validationRequest;
  }

  // *** Callbacks ***

  handleDownloadRequest = () => {
    const { workflow, workflowEntity } = this.props;
    const {
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      validObjectIds,
    } = this.state;

    const selectedDownload = assembleSelectedDownload(
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      validObjectIds,
      workflow,
      workflowEntity,
    );

    this.createBulkDownload(selectedDownload);
  };

  handleSelectDownloadType = newSelectedDownloadTypeName => {
    const { workflow } = this.props;
    const { selectedDownloadTypeName } = this.state;
    if (newSelectedDownloadTypeName === selectedDownloadTypeName) {
      return;
    }

    trackEvent("BulkDownloadModal_radio-button-for-download-type_selected", {
      downloadType: newSelectedDownloadTypeName,
      workflow,
    });
    this.setState({
      selectedDownloadTypeName: newSelectedDownloadTypeName,
    });
  };

  handleHeatmapLink = event => {
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

    withAnalytics(
      openUrlInNewTab(`/visualizations/heatmap?${params}`),
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_BULK_DOWNLOAD_MODAL_CLICKED,
      {
        params,
      },
    );
  };

  handleFieldSelect = (downloadType, fieldType, value, displayName) => {
    const { workflow } = this.props;
    this.setState(prevState => {
      trackEvent(
        "BulkDownloadModal_dropdown-field-for-download-type_selected",
        {
          downloadType,
          fieldType,
          fieldValue: value,
          displayName,
          workflow,
        },
      );
      // If the value is undefined, delete it from selectedFields.
      // This allows us to support cases where certain fields are conditionally required;
      // if the field becomes no longer required, we can unset it.
      const newSelectedFields =
        value !== undefined
          ? set([downloadType, fieldType], value, prevState.selectedFields)
          : unset([downloadType, fieldType], prevState.selectedFields);

      const newSelectedFieldsDisplay =
        displayName !== undefined
          ? set(
              [downloadType, fieldType],
              displayName,
              prevState.selectedFieldsDisplay,
            )
          : unset([downloadType, fieldType], prevState.selectedFieldsDisplay);

      return {
        selectedFields: newSelectedFields,
        selectedFieldsDisplay: newSelectedFieldsDisplay,
      };
    });
  };

  // *** Create bulk download and close modal ***

  createBulkDownload = async selectedDownload => {
    const { onGenerate, workflow } = this.props;

    let objectIds;

    if (workflow === WORKFLOWS.SHORT_READ_MNGS.value) {
      objectIds = { sampleIds: selectedDownload.validObjectIds };
    } else if (workflow === WORKFLOWS.CONSENSUS_GENOME.value) {
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
      trackEvent(
        ANALYTICS_EVENT_NAMES.BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_FAILED,
        {
          workflow,
          downloadType: selectedDownload.downloadType,
          ...objectIds,
        },
      );
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
  };

  render() {
    const { open, onClose, workflow, workflowEntity } = this.props;
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
      enableMassNormalizedBackgrounds,
    } = this.state;

    const numObjects = validObjectIds.size;
    const objectDownloaded =
      workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
        ? "consensus genome"
        : "sample";

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
              selectedFields={selectedFields}
              selectedDownloadTypeName={selectedDownloadTypeName}
              onDownloadRequest={this.handleDownloadRequest}
              workflow={workflow}
            />
          </div>
        </div>
      </Modal>
    );
  }
}

BulkDownloadModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  selectedIds: PropTypes.instanceOf(Set),
  // called when a bulk download has successfully been kicked off
  onGenerate: PropTypes.func.isRequired,
  workflow: PropTypes.string.isRequired,
  workflowEntity: PropTypes.string,
};

export default BulkDownloadModal;
