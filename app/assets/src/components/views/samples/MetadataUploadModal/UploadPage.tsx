import React from "react";
import { validateManualMetadataForProject } from "~/api/metadata";
import MetadataUpload from "~/components/common/Metadata/MetadataUpload";
import { NameId, SampleFromApi } from "~/interface/shared";
import Instructions from "./Instructions";
import cs from "./metadata_upload_modal.scss";

interface UploadPageProps {
  onMetadataChange: $TSFixMeFunction;
  project?: NameId;
  wizardEnableContinue?: $TSFixMeFunction;
  wizardSetOnContinueValidation?: $TSFixMeFunction;
  wizardSetOverlay?: $TSFixMeFunction;
  samples?: SampleFromApi[];
  workflow?: string;
  title?: JSX.Element;
}

class UploadPage extends React.Component<UploadPageProps> {
  state = {
    showInstructions: false,
    metadata: null,
    wasManual: false,
    issues: null,
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
        issues: null,
      });

      const result = await validateManualMetadataForProject(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        this.props.project.id,
        this.state.metadata,
      );

      this.setState({
        issues: result.issues,
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
      metadata,
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        <Instructions onClose={() => this.props.wizardSetOverlay(null)} />,
      );
    }
  };

  render() {
    const { workflow } = this.props;

    return (
      <div className={cs.uploadPage}>
        {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769 */}
        <MetadataUpload
          samples={this.props.samples}
          project={this.props.project}
          onMetadataChange={this.handleMetadataChange}
          onShowCSVInstructions={this.showInstructions}
          issues={this.state.wasManual ? this.state.issues : null}
          metadata={this.state.metadata}
          withinModal
          workflows={new Set([workflow])}
        />
      </div>
    );
  }
}

export default UploadPage;
