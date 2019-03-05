import React from "react";
import cx from "classnames";

import MetadataCSVUpload from "~/components/common/MetadataCSVUpload";
import PropTypes from "~/components/utils/propTypes";
import AlertIcon from "~ui/icons/AlertIcon";
import Tabs from "~/components/ui/controls/Tabs";

import cs from "./metadata_upload.scss";
import MetadataManualInput from "./MetadataManualInput";

class MetadataUpload extends React.Component {
  state = {
    currentTab: "Manual Input",
    issues: {
      errors: [],
      warnings: []
    }
  };

  handleTabChange = tab => {
    this.setState({ currentTab: tab, issues: null });
    // When the tab changes, reset state.
    this.props.onMetadataChange({
      metadata: null,
      issues: null,
      wasManual: tab === "Manual Input"
    });
  };

  // MetadataCSVUpload validates metadata before calling onMetadataChangeCSV.
  onMetadataChangeCSV = ({ metadata, issues }) => {
    this.props.onMetadataChange({ metadata, issues, wasManual: false });
    this.setState({
      issues
    });
  };

  // MetadataManualInput doesn't validate metadata before calling onMetadataChangeManual.
  // This happens when Continue is clicked in the parent component.
  onMetadataChangeManual = ({ metadata }) => {
    this.props.onMetadataChange({ metadata, wasManual: true });
  };

  renderTab = () => {
    if (this.state.currentTab === "Manual Input") {
      return (
        <MetadataManualInput
          project={this.props.project}
          samples={this.props.samples}
          samplesAreNew={this.props.samplesAreNew}
          onMetadataChange={this.onMetadataChangeManual}
          withinModal={this.props.withinModal}
        />
      );
    }

    if (this.state.currentTab === "CSV Upload") {
      return (
        <React.Fragment>
          <div>
            <span
              className={cs.link}
              onClick={this.props.onShowCSVInstructions}
            >
              See Instructions
            </span>
          </div>
          <MetadataCSVUpload
            className={cs.metadataCSVUpload}
            samples={this.props.samples}
            onMetadataChange={this.onMetadataChangeCSV}
            project={this.props.project}
            samplesAreNew={this.props.samplesAreNew}
          />
          <a className={cs.link} href="/metadata/metadata_template_csv">
            Download Metadata CSV Template
          </a>
        </React.Fragment>
      );
    }
    return null;
  };

  renderIssues = () => {
    const issues = this.props.issues || this.state.issues;
    const hasErrors = issues && issues.errors.length > 0;
    const hasWarnings = issues && issues.warnings.length > 0;

    if (!hasErrors && !hasWarnings) return null;

    return (
      <div className={cs.issues}>
        {hasErrors && (
          <div className={cs.errors}>
            <div className={cs.header}>
              <AlertIcon className={cs.icon} />
              {this.state.currentTab === "Manual Input"
                ? "Fix the following errors"
                : "Fix these errors and upload your CSV again."}
            </div>
            <div>
              {issues.errors.map((error, index) => (
                <div key={index} className={cs.item}>
                  <span className={cs.dot}>&bull;</span>
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {hasWarnings && (
          <div className={cs.warnings}>
            <div className={cs.header}>
              <AlertIcon className={cs.icon} />
              Warnings
            </div>
            <div>
              {issues.warnings.map((warning, index) => (
                <div key={index} className={cs.item}>
                  <span className={cs.dot}>&bull;</span>
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  render() {
    return (
      <div className={cx(cs.metadataUpload, this.props.className)}>
        <Tabs
          className={cs.tabs}
          tabs={["Manual Input", "CSV Upload"]}
          value={this.state.currentTab}
          onChange={this.handleTabChange}
        />
        {this.renderTab()}
        {this.renderIssues()}
      </div>
    );
  }
}

MetadataUpload.propTypes = {
  className: PropTypes.string,
  issues: PropTypes.shape({
    errors: PropTypes.arrayOf(PropTypes.string),
    warnings: PropTypes.arrayOf(PropTypes.string)
  }),
  onMetadataChange: PropTypes.func.isRequired,
  onShowCSVInstructions: PropTypes.func.isRequired,
  project: PropTypes.Project,
  samples: PropTypes.arrayOf(PropTypes.Sample),
  samplesAreNew: PropTypes.bool,
  withinModal: PropTypes.bool
};

export default MetadataUpload;
