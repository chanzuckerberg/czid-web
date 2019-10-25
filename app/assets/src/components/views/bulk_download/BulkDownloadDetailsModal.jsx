import React from "react";
import PropTypes from "prop-types";

import { getBulkDownload } from "~/api/bulk_downloads";
import Modal from "~ui/containers/Modal";
import LoadingMessage from "~/components/common/LoadingMessage";

import cs from "./bulk_download_details_modal.scss";
import BulkDownloadSummary from "./BulkDownloadSummary";

class BulkDownloadDetailsModal extends React.Component {
  state = {
    bulkDownloadDetails: null,
    downloadType: null,
  };

  async componentDidUpdate(prevProps) {
    if (
      this.props.bulkDownload &&
      prevProps.bulkDownload !== this.props.bulkDownload
    ) {
      this.setState({
        bulkDownloadDetails: null,
        downloadType: null,
      });

      const {
        bulk_download: bulkDownloadDetails,
        download_type: downloadType,
      } = await getBulkDownload(this.props.bulkDownload.id);

      this.setState({
        bulkDownloadDetails,
        downloadType,
      });
    }
  }

  getDownloadSummary = bulkDownloadDetails => ({
    params: bulkDownloadDetails.params,
    numSamples: bulkDownloadDetails.pipeline_runs.length,
  });

  renderDetails = () => {
    const { bulkDownloadDetails, downloadType } = this.state;

    if (bulkDownloadDetails === null) {
      return (
        <div className={cs.loadingContainer}>
          <LoadingMessage message="Loading download details..." />
        </div>
      );
    }

    return (
      <div className={cs.details}>
        <BulkDownloadSummary
          downloadType={downloadType}
          downloadSummary={this.getDownloadSummary(bulkDownloadDetails)}
        />
        <div className={cs.samplesHeader}>Samples in this download</div>
        <div className={cs.samplesList}>
          {bulkDownloadDetails.pipeline_runs.map(pipelineRun => (
            <div key={pipelineRun.id} className={cs.sampleName}>
              {pipelineRun.sample_name}
            </div>
          ))}
        </div>
      </div>
    );
  };

  render() {
    const { open, onClose } = this.props;
    return (
      <Modal narrow open={open} tall onClose={onClose}>
        <div className={cs.title}>Download Details</div>
        {open && this.renderDetails()}
      </Modal>
    );
  }
}

BulkDownloadDetailsModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  bulkDownload: PropTypes.shape({
    id: PropTypes.number,
  }),
};

export default BulkDownloadDetailsModal;
