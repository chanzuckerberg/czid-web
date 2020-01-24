import React from "react";
import PropTypes from "prop-types";

import {
  getBackgrounds,
  uploadedByCurrentUser,
  getHeatmapMetrics,
} from "~/api";
import {
  getBulkDownloadTypes,
  validateSampleIdsForBulkDownload,
} from "~/api/bulk_downloads";
import Modal from "~ui/containers/Modal";

import ChooseStep from "./ChooseStep";

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
  };

  componentDidMount() {
    this.parallelFetchNeededData();
  }

  // *** Async requests ***

  async parallelFetchNeededData() {
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

  // *** Render methods ***

  render() {
    const { open, onGenerate } = this.props;
    const {
      bulkDownloadTypes,
      validSampleIds,
      invalidSampleNames,
      validationError,
      backgroundOptions,
      metricsOptions,
      allSamplesUploadedByCurrentUser,
      loading,
    } = this.state;

    return (
      <Modal narrow open={open} tall onClose={this.props.onClose}>
        {loading && "L O A D I N G"}
        {!loading && (
          <ChooseStep
            downloadTypes={bulkDownloadTypes}
            onGenerate={onGenerate}
            validSampleIds={validSampleIds}
            invalidSampleNames={invalidSampleNames}
            validationError={validationError}
            backgroundOptions={backgroundOptions}
            metricsOptions={metricsOptions}
            allSamplesUploadedByCurrentUser={allSamplesUploadedByCurrentUser}
          />
        )}
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
