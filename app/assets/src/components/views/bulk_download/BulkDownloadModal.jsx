import React from "react";
import PropTypes from "prop-types";
import { find, get, set } from "lodash/fp";
import memoize from "memoize-one";

import { getBulkDownloadTypes } from "~/api";
import Modal from "~ui/containers/Modal";

import ChooseStep from "./ChooseStep";
import ReviewStep from "./ReviewStep";

const assembleSelectedDownload = memoize(
  (selectedDownloadTypeName, allSelectedFields, sampleIds) => {
    const fields = get(selectedDownloadTypeName, allSelectedFields);

    return {
      type: selectedDownloadTypeName,
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
    selectedDownloadTypeName: null,
    currentStep: "choose",
  };

  async componentDidMount() {
    const bulkDownloadTypes = await getBulkDownloadTypes();

    this.setState({
      bulkDownloadTypes,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // If the user has just closed the modal, reset it.
    if (prevProps.open && !this.props.open) {
      this.setState({
        selectedDownloadTypeName: null,
        currentStep: "choose",
        selectedFields: {},
      });
    }
  }

  onSelectDownloadType = selectedDownloadTypeName => {
    this.setState({
      selectedDownloadTypeName,
    });
  };

  onFieldSelect = (downloadType, fieldType, value) => {
    this.setState({
      selectedFields: set(
        [downloadType, fieldType],
        value,
        this.state.selectedFields
      ),
    });
  };

  onChooseStepContinue = () => {
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
    } = this.state;

    if (currentStep === "choose") {
      return (
        <ChooseStep
          downloadTypes={bulkDownloadTypes}
          selectedDownloadTypeName={selectedDownloadTypeName}
          onSelect={this.onSelectDownloadType}
          selectedFields={selectedFields}
          onFieldSelect={this.onFieldSelect}
          onContinue={this.onChooseStepContinue}
        />
      );
    }

    if (currentStep === "review") {
      const selectedDownload = assembleSelectedDownload(
        selectedDownloadTypeName,
        selectedFields,
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
  selectedSampleIds: PropTypes.arrayOf(PropTypes.number),
};

export default BulkDownloadModal;
