import React from "react";
import cx from "classnames";
import MetadataUpload from "~/components/common/MetadataUpload";
import Instructions from "~/components/views/samples/MetadataUploadModal/Instructions";
import PropTypes from "~/components/utils/propTypes";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import { validateManualMetadataForNewSamples } from "~/api";
import cs from "./sample_upload_flow.scss";

class UploadMetadataStep extends React.Component {
  state = {
    showInstructions: false,
    continueDisabled: true,
    metadata: null,
    issues: null,
    wasManual: false
  };

  setShowInstructions = showInstructions => {
    this.setState({
      showInstructions
    });
  };

  handleMetadataChange = ({ metadata, issues, wasManual }) => {
    this.setState({
      metadata,
      issues,
      wasManual
    });

    const metadataValid = metadata && !(issues && issues.errors.length > 0);

    this.setState({
      continueDisabled: !metadataValid
    });
  };

  handleContinue = async () => {
    // If manual input, validate when user presses Continue.
    if (this.state.wasManual) {
      this.setState({
        issues: null
      });

      const metadata = this.state.metadata;

      const result = await validateManualMetadataForNewSamples(
        this.props.samples,
        metadata
      );

      this.setState({
        issues: result.issues
      });

      if (metadata && !(result.issues && result.issues.errors.length > 0)) {
        this.props.onUploadMetadata({
          metadata,
          issues: result.issues
        });
      }
    } else {
      this.props.onUploadMetadata({
        metadata: this.state.metadata,
        issues: this.state.issues
      });
    }
  };

  render() {
    return (
      <div className={cs.uploadMetadataStep}>
        <div className={cx(!this.state.showInstructions && cs.hide)}>
          <Instructions onClose={() => this.setShowInstructions(false)} />
        </div>
        <div className={cx(this.state.showInstructions && cs.hide)}>
          <div>
            <div className={cs.title}>Upload Metadata</div>
            <div className={cs.dictionary}>
              <a
                href="/metadata/dictionary"
                className={cs.link}
                target="_blank"
              >
                See Metadata Dictionary
              </a>
            </div>
          </div>
          <MetadataUpload
            onShowCSVInstructions={() => this.setShowInstructions(true)}
            samples={this.props.samples}
            project={this.props.project}
            onMetadataChange={this.handleMetadataChange}
            samplesAreNew
            issues={this.state.wasManual ? this.state.issues : null}
          />
          <div className={cs.mainControls}>
            <PrimaryButton
              text="Continue"
              onClick={this.handleContinue}
              disabled={this.state.continueDisabled}
              rounded={false}
              className={cs.continueButton}
            />
            <a href="/home">
              <SecondaryButton text="Cancel" rounded={false} />
            </a>
          </div>
        </div>
      </div>
    );
  }
}

UploadMetadataStep.propTypes = {
  onUploadMetadata: PropTypes.func.isRequired,
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      host_genome_id: PropTypes.number
    })
  ),
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  })
};

export default UploadMetadataStep;
