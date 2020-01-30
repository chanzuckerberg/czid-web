import React from "react";
import PropTypes from "prop-types";
import { unset, get, set } from "lodash/fp";
import memoize from "memoize-one";

import {
  getBackgrounds,
  uploadedByCurrentUser,
  getHeatmapMetrics,
} from "~/api";
import {
  createBulkDownload,
  getBulkDownloadTypes,
  validateSampleIdsForBulkDownload,
} from "~/api/bulk_downloads";
import Modal from "~ui/containers/Modal";

import BulkDownloadModalOptions from "./BulkDownloadModalOptions";
import BulkDownloadModalFooter from "./BulkDownloadModalFooter";
import cs from "./bulk_download_modal.scss";

const assembleSelectedDownload = memoize(
  (
    selectedDownloadTypeName,
    allSelectedFields,
    allSelectedFieldsDisplay,
    sampleIds
  ) => {
    const fieldValues = get(selectedDownloadTypeName, allSelectedFields);
    const fieldDisplayNames = get(
      selectedDownloadTypeName,
      allSelectedFieldsDisplay
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
      sampleIds: Array.from(sampleIds),
    };
  }
);

// Stores information about conditional fields for bulk downloads.
const CONDITIONAL_FIELDS = [
  // Note: This first field is referenced directly in renderOption, as
  // it needs to display a placeholder component. Be careful when modifying.
  {
    field: "file_format",
    // The download type this conditional field applies to.
    downloadType: "reads_non_host",
    // The field this conditional field depends on.
    dependentField: "taxa_with_reads",
    // The values of the dependent field that trigger the conditional field.
    triggerValues: ["all", undefined],
  },
  {
    field: "background",
    downloadType: "combined_sample_taxon_results",
    dependentField: "metric",
    triggerValues: ["NR.zscore", "NT.zscore"],
  },
];

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
    validSampleIds: new Set(),
    invalidSampleNames: [],
    validationError: null,
    backgroundOptions: null,
    metricsOptions: null,
    allSamplesUploadedByCurrentUser: false,
    loading: true,
    waitingForCreate: false,
    createStatus: null,
    createError: null,
  };

  componentDidMount() {
    this.fetchSampleOptionsAndValidateSelectedSamples();
  }

  // *** Async requests ***

  async fetchSampleOptionsAndValidateSelectedSamples() {
    const { selectedSampleIds } = this.props;

    const bulkDownloadTypesRequest = this.fetchDownloadTypes();
    const sampleValidationInfoRequest = this.fetchValidationInfo(
      Array.from(selectedSampleIds)
    );
    const backgroundOptionsRequest = this.fetchBackgrounds();
    const metricsOptionsRequest = this.fetchHeatmapMetrics();
    const allSamplesUploadedByCurrentUserRequest = this.checkAllSamplesUploadedByCurrentUser();

    const [
      bulkDownloadTypes,
      sampleValidationInfo,
      backgroundOptions,
      metricsOptions,
      allSamplesUploadedByCurrentUser,
    ] = await Promise.all([
      bulkDownloadTypesRequest,
      sampleValidationInfoRequest,
      backgroundOptionsRequest,
      metricsOptionsRequest,
      allSamplesUploadedByCurrentUserRequest,
    ]);

    const validSampleIds = new Set(sampleValidationInfo.validSampleIds);
    const invalidSampleNames = sampleValidationInfo.invalidSampleNames;
    const validationError = sampleValidationInfo.error;

    this.setState({
      bulkDownloadTypes,
      validSampleIds,
      invalidSampleNames,
      validationError,
      backgroundOptions,
      metricsOptions,
      allSamplesUploadedByCurrentUser,
      loading: false,
    });
  }

  async fetchDownloadTypes() {
    const bulkDownloadTypes = await getBulkDownloadTypes();

    return bulkDownloadTypes;
  }

  async fetchValidationInfo(selectedSampleIds) {
    const sampleValidationInfo = await validateSampleIdsForBulkDownload(
      selectedSampleIds
    );

    return sampleValidationInfo;
  }

  // TODO(mark): Set a reasonable default background based on the samples and the user's preferences.
  async fetchBackgrounds() {
    const backgrounds = await getBackgrounds();

    const backgroundOptions = backgrounds.map(background => ({
      text: background.name,
      value: background.id,
    }));

    return backgroundOptions;
  }

  // We use the heatmap metrics as the valid metrics for bulk downloads.
  async fetchHeatmapMetrics() {
    const heatmapMetrics = await getHeatmapMetrics();

    return heatmapMetrics;
  }

  async checkAllSamplesUploadedByCurrentUser() {
    const { selectedSampleIds } = this.props;
    const allSamplesUploadedByCurrentUser = await uploadedByCurrentUser(
      Array.from(selectedSampleIds)
    );

    return allSamplesUploadedByCurrentUser;
  }

  // *** Callbacks ***

  handleDownloadRequest = () => {
    const {
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      validSampleIds,
    } = this.state;

    const selectedDownload = assembleSelectedDownload(
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      validSampleIds
    );
    this.createBulkDownload(selectedDownload);
  };

  handleSelectDownloadType = selectedDownloadTypeName => {
    this.setState({
      selectedDownloadTypeName,
    });
  };

  handleFieldSelect = (downloadType, fieldType, value, displayName) => {
    this.setState(prevState => {
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
              prevState.selectedFieldsDisplay
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
    const { onGenerate } = this.props;

    this.setState({
      waitingForCreate: true,
    });
    try {
      await createBulkDownload(selectedDownload);
    } catch (e) {
      this.setState({
        waitingForCreate: false,
        createStatus: "error",
        createError: e.error,
      });
      return;
    }

    onGenerate();
  };

  // *** Render methods ***

  render() {
    const { open, onClose } = this.props;
    const {
      bulkDownloadTypes,
      validSampleIds,
      invalidSampleNames,
      validationError,
      backgroundOptions,
      metricsOptions,
      allSamplesUploadedByCurrentUser,
      selectedDownloadTypeName,
      selectedFields,
      waitingForCreate,
      createStatus,
      createError,
    } = this.state;

    const numSamples = validSampleIds.size;

    return (
      <Modal narrow open={open} tall onClose={onClose}>
        <div className={cs.modal}>
          <div className={cs.header}>
            <div className={cs.title}>Select a Download Type</div>
            <div className={cs.tagline}>
              {numSamples} sample{numSamples != 1 ? "s" : ""} selected
            </div>
          </div>
          <div className={cs.options}>
            <BulkDownloadModalOptions
              downloadTypes={bulkDownloadTypes}
              validSampleIds={validSampleIds}
              backgroundOptions={backgroundOptions}
              metricsOptions={metricsOptions}
              allSamplesUploadedByCurrentUser={allSamplesUploadedByCurrentUser}
              onFieldSelect={this.handleFieldSelect}
              selectedFields={selectedFields}
              selectedDownloadTypeName={selectedDownloadTypeName}
              onSelect={this.handleSelectDownloadType}
              conditionalFields={CONDITIONAL_FIELDS}
            />
          </div>
          <div className={cs.footer}>
            <BulkDownloadModalFooter
              loading={bulkDownloadTypes ? false : true}
              downloadTypes={bulkDownloadTypes}
              validSampleIds={validSampleIds}
              invalidSampleNames={invalidSampleNames}
              validationError={validationError}
              waitingForCreate={waitingForCreate}
              createStatus={createStatus}
              createError={createError}
              selectedFields={selectedFields}
              selectedDownloadTypeName={selectedDownloadTypeName}
              conditionalFields={CONDITIONAL_FIELDS}
              onDownloadRequest={this.handleDownloadRequest}
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
  selectedSampleIds: PropTypes.instanceOf(Set),
  // called when a bulk download has successfully been kicked off
  onGenerate: PropTypes.func.isRequired,
};

export default BulkDownloadModal;
