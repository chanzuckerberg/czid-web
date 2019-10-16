import React from "react";
import PropTypes from "prop-types";
import { get, find } from "lodash/fp";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";

import cs from "./review_step.scss";

class ReviewStep extends React.Component {
  renderDownloadField = (field, value) => {
    const { downloadType } = this.props;
    const fieldDisplayName =
      get("display_name", find(["type", field], downloadType.fields)) || "";

    return (
      <div className={cs.field}>
        <div className={cs.name}>{fieldDisplayName}</div>
        <div className={cs.value}>{value}</div>
      </div>
    );
  };

  render() {
    const { selectedDownload, downloadType, onBackClick } = this.props;

    return (
      <div className={cs.reviewStep}>
        <div className={cs.header}>
          <div className={cs.title}>Review Your Download</div>
          <div className={cs.editLink} onClick={onBackClick}>
            Edit download
          </div>
        </div>
        <div className={cs.selectedDownload}>
          <div className={cs.title}>
            <div className={cs.name}>{downloadType.display_name}</div>
            <div className={cs.numSamples}>
              &nbsp;for {selectedDownload.sampleIds.length} samples
            </div>
          </div>
          {selectedDownload.fields && (
            <div className={cs.fields}>
              {Object.entries(selectedDownload.fields).map(([key, value]) =>
                this.renderDownloadField(key, value)
              )}
            </div>
          )}
        </div>
        <div className={cs.footer}>
          <PrimaryButton text="Start Generating Download" />
          <div className={cs.downloadDisclaimer}>
            Downloads for larger files can take multiple hours to generate.
          </div>
        </div>
      </div>
    );
  }
}

ReviewStep.propTypes = {
  selectedDownload: PropTypes.shape({
    type: PropTypes.string.isRequired,
    fields: PropTypes.object,
    sampleIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
  downloadType: PropTypes.shape({
    type: PropTypes.string,
    display_name: PropTypes.string,
    description: PropTypes.string,
    category: PropTypes.string,
    fields: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        display_name: PropTypes.string,
      })
    ),
  }),
  onBackClick: PropTypes.func.isRequired,
};

export default ReviewStep;
