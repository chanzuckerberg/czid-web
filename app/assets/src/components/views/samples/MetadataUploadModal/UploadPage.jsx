import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";
import MetadataCSVUpload from "~/components/common/MetadataCSVUpload";
import cs from "./metadata_upload_modal.scss";

class UploadPage extends React.Component {
  state = {
    hasIssues: false
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

  render() {
    return (
      <MetadataCSVUpload
        className={cx(
          cs.metadataCSVUpload,
          this.state.hasIssues && cs.hasIssues
        )}
        project={this.props.project}
        onMetadataChange={this.handleMetadataChange}
      />
    );
  }
}

UploadPage.propTypes = {
  onMetadataChange: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  }),
  wizardEnableContinue: PropTypes.func
};

export default UploadPage;
