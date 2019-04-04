import React from "react";
import PropTypes from "prop-types";

import cs from "./metadata_upload_modal.scss";
import cx from "classnames";
import NarrowContainer from "~/components/layout/NarrowContainer";

class UploadInstructions extends React.Component {
  render() {
    const { standalone, onClose, size } = this.props;

    const body = (
      <div className={cx(cs.uploadInstructions, standalone && cs.standalone)}>
        <div className={cs.header}>
          {!standalone && (
            <div className={cs.backButton} onClick={onClose}>{`< Back`}</div>
          )}
          <div className={cs.title}>How to Upload a Metadata CSV</div>
        </div>
        <div className={cs.content}>
          <div className={cs.sectionTitle}>Instructions</div>
          <ol className={cs.section}>
            <li>
              Review the fields in our{" "}
              <a
                href="/metadata/dictionary"
                target="_blank"
                rel="noopener noreferrer"
                className={cs.link}
              >
                metadata dictionary
              </a>, where you will find definitions and format requirements.
              Take special note of the <b>required</b> fields, which you must
              provide when uploading a new sample.
            </li>
            <li>
              You can use your own CSV or copy your metadata into our{" "}
              <a
                href="/metadata/metadata_template_csv"
                target="_blank"
                rel="noopener noreferrer"
                className={cs.link}
              >
                CSV template.
              </a>
            </li>
            <li>Make sure your column headers match our naming convention.</li>
            <li>Make sure your metadata values are in the correct format.</li>
            <li>Upload your CSV file.</li>
            <li>
              If there are errors, please make the necessary changes in your CSV
              and upload it again.
            </li>
          </ol>
        </div>
      </div>
    );

    return standalone ? (
      <NarrowContainer size={size}>{body}</NarrowContainer>
    ) : (
      body
    );
  }
}

UploadInstructions.propTypes = {
  onClose: PropTypes.func.isRequired,
  standalone: PropTypes.bool,
  size: PropTypes.oneOf(["small"])
};

export default UploadInstructions;
