import React from "react";
import cx from "classnames";

import MetadataUpload from "~/components/common/MetadataUpload";
import Instructions from "~/components/views/samples/MetadataUploadModal/Instructions";
import PropTypes from "~/components/utils/propTypes";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import { validateManualMetadataForNewSamples } from "~/api/metadata";
import { logAnalyticsEvent } from "~/api/analytics";

import cs from "./sample_upload_flow.scss";

class UploadMetadataStep extends React.Component {
  state = {
    showInstructions: false,
    continueDisabled: true,
    metadata: null,
    issues: null,
    wasManual: false,
  };

  setShowInstructions = showInstructions => {
    this.setState({
      showInstructions,
    });
  };

  handleMetadataChange = ({ metadata, issues, wasManual }) => {
    this.setState({
      metadata,
      issues,
      wasManual,
    });

    const metadataValid = metadata && !(issues && issues.errors.length > 0);

    this.setState({
      continueDisabled: !metadataValid,
    });
  };

  handleContinue = async () => {
    // If manual input, validate when user presses Continue.
    let result = null;
    if (this.state.wasManual) {
      this.setState({
        issues: null,
      });

      const metadata = this.state.metadata;

      result = await validateManualMetadataForNewSamples(
        this.props.samples,
        metadata
      );

      this.setState({
        issues: result.issues,
        newHostGenomes: result.newHostGenomes,
      });

      if (metadata && !(result.issues && result.issues.errors.length > 0)) {
        this.props.onUploadMetadata({
          metadata,
          issues: result.issues,
          newHostGenomes: result.newHostGenomes,
        });
      }
    } else {
      this.props.onUploadMetadata({
        metadata: this.state.metadata,
        issues: this.state.issues,
        newHostGenomes: this.state.newHostGenomes,
      });
    }
    logAnalyticsEvent("UploadMetadataStep_continue-button_clicked", {
      wasManual: this.state.wasManual,
      errors: (result || this.state).issues.errors.length,
      warnings: (result || this.state).issues.warnings.length,
      samples: this.props.samples.length,
      projectId: this.props.project.id,
      projectName: this.props.project.name,
    });
  };

  render() {
    return (
      <div className={cs.uploadMetadataStep}>
        <div
          className={cx(
            cs.uploadInstructions,
            !this.state.showInstructions && cs.hide
          )}
        >
          <Instructions onClose={() => this.setShowInstructions(false)} />
        </div>
        <div
          className={cx(
            cs.uploadFlowStep,
            this.state.showInstructions && cs.hide,
            this.props.visible && cs.visible
          )}
        >
          <div className={cs.flexContent}>
            <MetadataUpload
              onShowCSVInstructions={() => this.setShowInstructions(true)}
              samples={this.props.samples}
              project={this.props.project}
              onMetadataChange={this.handleMetadataChange}
              samplesAreNew
              issues={this.state.wasManual ? this.state.issues : null}
              visible={this.props.visible}
              onDirty={this.props.onDirty}
              metadata={this.state.metadata}
            />
          </div>
          <div className={cs.controls}>
            <PrimaryButton
              text="Continue"
              onClick={this.handleContinue}
              disabled={this.state.continueDisabled}
              rounded={false}
              className={cs.continueButton}
            />
            <a href="/home">
              <SecondaryButton
                text="Cancel"
                rounded={false}
                onClick={() =>
                  logAnalyticsEvent(
                    "UploadMetadataStep_cancel-button_clicked",
                    {
                      projectId: this.props.project.id,
                      projectName: this.props.project.name,
                    }
                  )
                }
              />
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
      host_genome_id: PropTypes.number,
    })
  ),
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
  visible: PropTypes.bool,
  // Immediately called when the user changes anything, even before validation has returned.
  // Can be used to disable the header navigation.
  onDirty: PropTypes.func.isRequired,
};

export default UploadMetadataStep;
