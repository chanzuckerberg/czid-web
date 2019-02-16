// A CSV Upload component for uploading metadata.
// Sends uploaded to server for validation and displays errors and warnings.
import React from "react";
import cx from "classnames";
import { map, pickBy, zipObject, isNull } from "lodash/fp";
import CSVUpload from "~ui/controls/CSVUpload";
import AlertIcon from "~ui/icons/AlertIcon";
import {
  validateMetadataCSVForProject,
  validateMetadataCSVForNewSamples
} from "~/api";
import cs from "./metadata_csv_upload.scss";
import PropTypes from "prop-types";

const processCSVMetadata = csv => {
  const { headers, rows } = csv;

  return {
    headers,
    rows: map(
      // Remove empty values, and convert rows from array of strings to object.
      row => pickBy(value => value !== "", zipObject(headers, row)),
      rows
    )
  };
};

class MetadataCSVUpload extends React.Component {
  // MetadataCSVUpload stores each row as arrays of strings,
  // but converts the row to objects before calling onMetadataChange.
  state = {
    metadata: null,
    issues: {
      errors: [],
      warnings: []
    }
  };

  onCSV = async csv => {
    this.props.onMetadataChange({
      metadata: null,
      issues: {
        errors: [],
        warnings: []
      }
    });
    this.setState({ metadata: csv });

    let serverResponse;

    // For uploading metadata to existing samples in a project.
    if (this.props.project) {
      serverResponse = await validateMetadataCSVForProject(
        this.props.project.id,
        csv
      );
      // For uploading metadata together with new samples.
    } else {
      serverResponse = await validateMetadataCSVForNewSamples(
        this.props.samples,
        csv
      );
    }

    this.setState({ issues: serverResponse.issues });

    this.props.onMetadataChange({
      metadata: processCSVMetadata(csv),
      issues: serverResponse.issues
    });
  };

  render() {
    const hasMetadata = !isNull(this.state.metadata);
    const hasErrors = this.state.issues.errors.length > 0;
    const hasWarnings = this.state.issues.warnings.length > 0;
    return (
      <div className={cx(cs.metadataCSVUpload, this.props.className)}>
        <CSVUpload
          title={hasMetadata ? "" : "Upload your metadata CSV"}
          onCSV={this.onCSV}
          className={cx(cs.csvUpload, hasMetadata && cs.uploaded)}
        />
        {(hasErrors || hasWarnings) && (
          <div className={cs.issues}>
            {hasErrors && (
              <div className={cs.errors}>
                <div className={cs.header}>
                  <AlertIcon className={cs.icon} />
                  Fix these errors and upload your CSV again.
                </div>
                <div>
                  {this.state.issues.errors.map((error, index) => (
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
                  {this.state.issues.warnings.map((warning, index) => (
                    <div key={index} className={cs.item}>
                      <span className={cs.dot}>&bull;</span>
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

MetadataCSVUpload.propTypes = {
  // For uploading metadata to existing samples in a project.
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  }),
  // For uploading metadata together with new samples.
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      host_genome_id: PropTypes.number
    })
  ),
  className: PropTypes.string,
  onMetadataChange: PropTypes.func.isRequired
};

export default MetadataCSVUpload;
