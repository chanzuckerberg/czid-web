import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";
import MetadataCSVUpload from "~/components/common/MetadataCSVUpload";
import Instructions from "./Instructions";
import cs from "./metadata_upload_modal.scss";

class UploadPage extends React.Component {
  state = {
    hasIssues: false,
    showInstructions: false
  };

  componentDidMount() {
    if (this.props.wizardEnableContinue) {
      this.props.wizardEnableContinue(false);
    }
  }

  handleMetadataChange = ({ metadata, issues }) => {
    const hasIssues =
      issues && (issues.errors.length > 0 || issues.warnings.length > 0);
    this.setState({
      hasIssues
    });
    this.props.onMetadataChange({ metadata, issues });

    const metadataValid = metadata && !(issues && issues.errors.length > 0);

    if (this.props.wizardEnableContinue) {
      this.props.wizardEnableContinue(metadataValid);
    }
  };

  showInstructions = () => {
    this.props.wizardSetOverlay(
      <Instructions onClose={() => this.props.wizardSetOverlay(null)} />
    );
  };

  render() {
    return (
      <div className={cs.uploadPage}>
        <div>
          <span className={cs.link} onClick={this.showInstructions}>
            See Instructions
          </span>
          <span> | </span>
          <a href="/metadata/dictionary" className={cs.link}>
            See Metadata Dictionary
          </a>
        </div>
        <MetadataCSVUpload
          className={cx(
            cs.metadataCSVUpload,
            this.state.hasIssues && cs.hasIssues
          )}
          project={this.props.project}
          onMetadataChange={this.handleMetadataChange}
        />
        <a className={cs.link} href="/metadata/metadata_template_csv">
          Download Metadata CSV Template
        </a>
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
  wizardEnableContinue: PropTypes.func.isRequired,
  wizardSetOverlay: PropTypes.func.isRequired
};

export default UploadPage;
