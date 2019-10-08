import React from "react";
import PropTypes from "prop-types";
import { set } from "lodash/fp";

import { getBulkDownloadTypes } from "~/api";
import Modal from "~ui/containers/Modal";

import ChooseStep from "./ChooseStep";

class BulkDownloadModal extends React.Component {
  state = {
    bulkDownloadTypes: null,
    // We save the options for ALL download types.
    // If the user clicks between different download types, all their selections are saved.
    selectedOptions: {},
    selectedDownloadType: null,
  };

  async componentDidMount() {
    const bulkDownloadTypes = await getBulkDownloadTypes();

    this.setState({
      bulkDownloadTypes,
    });
  }

  onSelectDownloadType = selectedDownloadType => {
    this.setState({
      selectedDownloadType,
    });
  };

  onOptionSelect = (downloadType, optionType, value) => {
    this.setState({
      selectedOptions: set(
        [downloadType, optionType],
        value,
        this.state.selectedOptions
      ),
    });
  };

  render() {
    const { open } = this.props;
    const {
      bulkDownloadTypes,
      selectedDownloadType,
      selectedOptions,
    } = this.state;

    return (
      <Modal narrow open={open} tall onClose={this.props.onClose}>
        <ChooseStep
          downloadTypes={bulkDownloadTypes}
          selectedDownloadType={selectedDownloadType}
          onSelect={this.onSelectDownloadType}
          selectedOptions={selectedOptions}
          onOptionSelect={this.onOptionSelect}
        />
      </Modal>
    );
  }
}

BulkDownloadModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
};

export default BulkDownloadModal;
