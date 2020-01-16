import React from "react";
import PropTypes from "prop-types";
import { unset, find, get, set } from "lodash/fp";
import memoize from "memoize-one";

import { getBulkDownloadTypes } from "~/api/bulk_downloads";
import Modal from "~ui/containers/Modal";

import ChooseStep from "./ChooseStep";
import ReviewStep from "./ReviewStep";

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
    currentStep: "choose",
    invalidSampleIds: [],
    validSampleIds: new Set(),
    filteredSampleNames: [],
  };

  componentDidMount() {
    this.filterSamples();
    this.fetchDownloadTypes();
  }

  componentDidUpdate(prevProps) {
    // If the user has just closed the modal, reset it.
    if (prevProps.open && !this.props.open) {
      this.setState({
        selectedDownloadTypeName: null,
        currentStep: "choose",
        selectedFields: {},
      });
    }
  }

  async fetchDownloadTypes() {
    const bulkDownloadTypes = await getBulkDownloadTypes();

    this.setState({
      bulkDownloadTypes,
    });
  }

  filterSamples = () => {
    const [
      validSampleIds,
      invalidSampleIds,
    ] = this.filterSamplesThatCannotBeDownloaded();
    const filteredSampleNames = this.getFilteredSampleNames(invalidSampleIds);

    this.setState({
      validSampleIds,
      invalidSampleIds,
      filteredSampleNames,
    });
  };

  filterSamplesThatCannotBeDownloaded = () => {
    const { selectedSampleIds, selectedSampleStatuses } = this.props;
    const validSampleIds = [];
    const invalidSampleIds = [];
    selectedSampleIds.forEach(id => {
      const sampleInfo = selectedSampleStatuses.get(id);
      if (sampleInfo && sampleInfo.status == "complete") {
        validSampleIds.push(id);
      } else {
        invalidSampleIds.push(id);
      }
    });

    return [new Set(validSampleIds), invalidSampleIds];
  };

  getFilteredSampleNames = invalidSampleIds => {
    const { selectedSampleStatuses } = this.props;
    const sampleNames = invalidSampleIds.map(id => {
      const sampleInfo = selectedSampleStatuses.get(id);
      if (sampleInfo) {
        return sampleInfo.name;
      } else {
        return "N/A";
      }
    });
    return sampleNames;
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

  handleChooseStepContinue = () => {
    this.setState({ currentStep: "review" });
  };
  handleBackClick = () => {
    this.setState({ currentStep: "choose" });
  };

  renderStep = () => {
    const {
      currentStep,
      bulkDownloadTypes,
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      validSampleIds,
      filteredSampleNames,
    } = this.state;

    if (currentStep === "choose") {
      return (
        <ChooseStep
          downloadTypes={bulkDownloadTypes}
          selectedDownloadTypeName={selectedDownloadTypeName}
          onSelect={this.handleSelectDownloadType}
          selectedFields={get(selectedDownloadTypeName, selectedFields)}
          onFieldSelect={this.handleFieldSelect}
          onContinue={this.handleChooseStepContinue}
          validSampleIds={validSampleIds}
          filteredSampleNames={filteredSampleNames}
        />
      );
    }

    if (currentStep === "review") {
      const selectedDownload = assembleSelectedDownload(
        selectedDownloadTypeName,
        selectedFields,
        selectedFieldsDisplay,
        validSampleIds
      );

      const selectedDownloadType = find(
        ["type", selectedDownloadTypeName],
        bulkDownloadTypes
      );

      return (
        <ReviewStep
          selectedDownload={selectedDownload}
          downloadType={selectedDownloadType}
          onBackClick={this.handleBackClick}
        />
      );
    }
  };

  render() {
    const { open } = this.props;

    return (
      <Modal narrow open={open} tall onClose={this.props.onClose}>
        {this.renderStep()}
      </Modal>
    );
  }
}

BulkDownloadModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  selectedSampleIds: PropTypes.instanceOf(Set),
  selectedSampleStatuses: PropTypes.instanceOf(Map),
};

export default BulkDownloadModal;
