import React from "react";
import PropTypes from "~/components/utils/propTypes";
import MetadataUpload from "~/components/common/MetadataUpload";
import Instructions from "./Instructions";
import { validateManualMetadataForProject } from "~/api/metadata";
import cs from "./metadata_upload_modal.scss";

class UploadPage extends React.Component {
  state = {
    showInstructions: false,
    metadata: null,
    wasManual: false,
    issues: null
  };

  componentDidMount() {
    if (this.props.wizardEnableContinue) {
      this.props.wizardEnableContinue(false);
    }
    if (this.props.wizardSetOnContinueValidation) {
      this.props.wizardSetOnContinueValidation(this.verifyMetadata);
    }
  }

  // Called by the wizard when user clicks Continue.
  verifyMetadata = async () => {
    if (this.state.wasManual) {
      this.setState({
        issues: null
      });

      const result = await validateManualMetadataForProject(
        this.props.project.id,
        this.state.metadata
      );

      this.setState({
        issues: result.issues
      });

      return (
        this.state.metadata &&
        !(result.issues && result.issues.errors.length > 0)
      );
    }
    return true;
  };

  handleMetadataChange = ({ metadata, issues, wasManual }) => {
    this.setState({
      wasManual,
      metadata
    });
    this.props.onMetadataChange({ metadata, issues });

    const metadataValid = metadata && !(issues && issues.errors.length > 0);

    if (this.props.wizardEnableContinue) {
      this.props.wizardEnableContinue(metadataValid);
    }
  };

  showInstructions = () => {
    if (this.props.wizardSetOverlay) {
      this.props.wizardSetOverlay(
        <Instructions onClose={() => this.props.wizardSetOverlay(null)} />
      );
    }
  };

  render() {
    return (
      <div className={cs.uploadPage}>
        <MetadataUpload
          samples={this.props.samples}
          project={this.props.project}
          onMetadataChange={this.handleMetadataChange}
          onShowCSVInstructions={this.showInstructions}
          issues={this.state.wasManual ? this.state.issues : null}
          withinModal
        />
      </div>
    );
  }
}

UploadPage.propTypes = {
  onMetadataChange: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  }),
  wizardEnableContinue: PropTypes.func,
  wizardSetOnContinueValidation: PropTypes.func,
  wizardSetOverlay: PropTypes.func,
  samples: PropTypes.arrayOf(PropTypes.Sample)
};

export default UploadPage;
