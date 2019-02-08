import React from "react";
import cx from "classnames";
import MetadataCSVUpload from "~/components/common/MetadataCSVUpload";
import Instructions from "~/components/views/samples/MetadataUploadModal/Instructions";
import PropTypes from "~/components/utils/propTypes";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import cs from "./sample_upload_flow.scss";

class UploadMetadataStep extends React.Component {
  state = {
    showInstructions: false,
    hasIssues: null,
    continueDisabled: true
  };

  setShowInstructions = showInstructions => {
    this.setState({
      showInstructions
    });
  };

  handleMetadataChange = ({ metadata, issues }) => {
    const hasIssues =
      issues && (issues.errors.length > 0 || issues.warnings.length > 0);
    this.setState({
      hasIssues
    });
    this.props.onMetadataChange({ metadata, issues });

    const metadataValid = metadata && !(issues && issues.errors.length > 0);

    this.setState({
      continueDisabled: !metadataValid
    });
  };

  render() {
    return (
      <div className={cs.uploadMetadataStep}>
        <div className={cx(!this.state.showInstructions && cs.hide)}>
          <Instructions onClose={() => this.setShowInstructions(false)} />
        </div>
        <div className={cx(this.state.showInstructions && cs.hide)}>
          <div>
            <div className={cs.title}>Metadata Upload</div>
          </div>
          <div>
            <span
              className={cs.link}
              onClick={() => this.setShowInstructions(true)}
            >
              See Instructions
            </span>
            <span> | </span>
            <a href="/metadata/dictionary" className={cs.link} target="_blank">
              See Metadata Dictionary
            </a>
          </div>
          <MetadataCSVUpload
            className={cx(
              cs.metadataCSVUpload,
              this.state.hasIssues && cs.hasIssues
            )}
            samples={this.props.samples}
            onMetadataChange={this.handleMetadataChange}
          />
          <a className={cs.link} href="/metadata/metadata_template_csv">
            Download Metadata CSV Template
          </a>
          <div className={cs.controls}>
            <PrimaryButton
              text="Continue"
              onClick={this.props.onContinue}
              disabled={this.state.continueDisabled}
              rounded={false}
            />
          </div>
        </div>
      </div>
    );
  }
}

UploadMetadataStep.propTypes = {
  onMetadataChange: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  }),
  onContinue: PropTypes.func.isRequired,
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      host_genome_id: PropTypes.number
    })
  )
};

export default UploadMetadataStep;
