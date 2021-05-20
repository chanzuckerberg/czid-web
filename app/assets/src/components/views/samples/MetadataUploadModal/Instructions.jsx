import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import NarrowContainer from "~/components/layout/NarrowContainer";
import List from "~/components/ui/List";
import cs from "./metadata_upload_modal.scss";

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
          <List
            listClassName={cs.section}
            ordered={true}
            listItems={[
              <React.Fragment key={"metadata-dictionary"}>
                Review the fields in our{" "}
                <a
                  href="/metadata/dictionary"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cs.link}
                >
                  metadata dictionary
                </a>
                , where you will find definitions and format requirements. Take
                special note of the <b>required</b> fields, which you must
                provide when uploading a new sample.
              </React.Fragment>,
              <React.Fragment key={"metadata-template-csv"}>
                You can use your own CSV or copy your metadata into our{" "}
                <a
                  href="/metadata/metadata_template_csv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cs.link}
                >
                  CSV template.
                </a>
                <p>
                  {`If your entered Host Organism does not match a supported host
                genome, we will only subtract out ERCCs and the Human genome. You can
                read more about how to request a new genome to be added to IDseq `}
                  <a
                    href="https://chanzuckerberg.zendesk.com/hc/en-us/articles/360034790814-How-do-I-request-a-new-host-genome-be-added-to-IDseq-"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cs.link}
                  >
                    here.
                  </a>
                </p>
              </React.Fragment>,
              `Make sure your column headers match our naming convention.`,
              `Make sure your metadata values are in the correct format.`,
              `Upload your CSV file.`,
              `If there are errors, please make the necessary changes in your CSV
              and upload it again.`,
            ]}
          />
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
  size: PropTypes.oneOf(["small"]),
};

export default UploadInstructions;
