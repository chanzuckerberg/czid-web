import React from "react";
import PropTypes from "prop-types";
import { find, get, set } from "lodash/fp";
import memoize from "memoize-one";

import { getBulkDownloadTypes } from "~/api/bulk_downloads";
import { getBackgrounds } from "~/api";
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
    fieldOptions: {},
  };

  componentDidMount() {
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

    // When the modal is opened, fetch options for the bulk download fields.
    if (!prevProps.open && this.props.open) {
      this.fetchBackgrounds();
    }
  }

  async fetchDownloadTypes() {
    const bulkDownloadTypes = await getBulkDownloadTypes();

    this.setState({
      bulkDownloadTypes,
    });
  }

  // TODO(mark): Set a reasonable default background based on the samples and the user's preferences.
  async fetchBackgrounds() {
    if (this.state.fieldOptions.backgrounds) {
      return;
    }

    const backgrounds = await getBackgrounds();

    // Since multiple async functions might set fieldOptions, we use the function form
    // of setState to prevent race conditions.
    this.setState(prevState => ({
      ...prevState,
      fieldOptions: set("backgrounds", backgrounds, prevState.fieldOptions),
    }));
  }

  handleSelectDownloadType = selectedDownloadTypeName => {
    this.setState({
      selectedDownloadTypeName,
    });
  };

  handleFieldSelect = (downloadType, fieldType, value, displayName) => {
    this.setState({
      selectedFields: set(
        [downloadType, fieldType],
        value,
        this.state.selectedFields
      ),
      selectedFieldsDisplay: set(
        [downloadType, fieldType],
        displayName,
        this.state.selectedFieldsDisplay
      ),
    });
  };

  handleChooseStepContinue = () => {
    this.setState({ currentStep: "review" });
  };
  handleBackClick = () => {
    this.setState({ currentStep: "choose" });
  };

  renderStep = () => {
    const { selectedSampleIds } = this.props;
    const {
      currentStep,
      bulkDownloadTypes,
      selectedDownloadTypeName,
      selectedFields,
      selectedFieldsDisplay,
      fieldOptions,
    } = this.state;

    if (currentStep === "choose") {
      return (
        <ChooseStep
          downloadTypes={bulkDownloadTypes}
          selectedDownloadTypeName={selectedDownloadTypeName}
          onSelect={this.handleSelectDownloadType}
          selectedFields={selectedFields}
          onFieldSelect={this.handleFieldSelect}
          onContinue={this.handleChooseStepContinue}
          fieldOptions={fieldOptions}
        />
      );
    }

    if (currentStep === "review") {
      const selectedDownload = assembleSelectedDownload(
        selectedDownloadTypeName,
        selectedFields,
        selectedFieldsDisplay,
        selectedSampleIds
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
};

export default BulkDownloadModal;
