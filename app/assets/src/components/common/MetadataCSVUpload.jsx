// A CSV Upload component for uploading metadata.
// Sends uploaded to server for validation and displays errors and warnings.
import React from "react";
import cx from "classnames";
import { filter, map, zip, fromPairs, isNull, isEqual } from "lodash/fp";
import CSVUpload from "~ui/controls/CSVUpload";
import {
  validateMetadataCSVForProject,
  validateMetadataCSVForNewSamples
} from "~/api/metadata";
import cs from "./metadata_csv_upload.scss";
import PropTypes from "prop-types";

const processCSVMetadata = csv => {
  const { headers, rows } = csv;

  return {
    headers,
    rows: map(
      // Remove empty values, and convert rows from array of strings to object.
      // It's possible to have two different MetadataFields with the same name, but for different host genomes.
      // In this case, only one of the two fields will have a value for any given sample
      // (since only one of them will the sample's host genome).
      // There is a risk if you naively zipObject that you will overwrite the actual value with an empty value
      // (from the other metadata field with the same name), since precedence is based on the order.
      // The below code makes sure this case is handled correctly by filtering before converting to an object.
      row => fromPairs(filter(pair => pair[1] !== "", zip(headers, row))),
      rows
    )
  };
};

class MetadataCSVUpload extends React.Component {
  // MetadataCSVUpload stores each row as arrays of strings,
  // but converts the row to objects before calling onMetadataChange.
  state = {
    metadata: null,
    validatingCSV: false,
    // Keep track of the last sample names and project id validated so we can re-validate if the samples changed.
    lastSampleNamesValidated: null,
    lastProjectIdValidated: null
  };

  componentDidUpdate(prevProps) {
    // When the CSV Upload becomes visible again, validate the CSV if the samples have changed.
    if (
      !prevProps.visible &&
      this.props.visible &&
      this.state.metadata &&
      (!isEqual(
        map("name", this.props.samples),
        this.state.lastSampleNamesValidated
      ) ||
        this.props.project.id !== this.state.lastProjectIdValidated)
    ) {
      this.validateCSV(this.state.metadata);
    }
  }

  onCSV = csv => {
    if (this.props.onDirty) {
      this.props.onDirty();
    }
    this.setState({ metadata: csv });
    this.validateCSV(csv);
  };

  validateCSV = async csv => {
    this.props.onMetadataChange({
      metadata: null,
      issues: {
        errors: [],
        warnings: []
      },
      validatingCSV: true
    });

    let serverResponse;

    // For uploading metadata together with new samples.
    if (this.props.samplesAreNew) {
      // We assume that all samples are being uploaded to this.props.project.
      this.setState({
        lastSampleNamesValidated: map("name", this.props.samples),
        lastProjectIdValidated: this.props.project.id
      });

      serverResponse = await validateMetadataCSVForNewSamples(
        this.props.samples,
        csv
      );
      // For uploading metadata to existing samples in a project.
    } else {
      serverResponse = await validateMetadataCSVForProject(
        this.props.project.id,
        csv
      );
    }

    this.props.onMetadataChange({
      metadata: processCSVMetadata(csv),
      issues: serverResponse.issues,
      validatingCSV: false
    });
  };

  render() {
    const hasMetadata = !isNull(this.state.metadata);
    return (
      <div className={cx(cs.metadataCSVUpload, this.props.className)}>
        <CSVUpload
          title={hasMetadata ? "" : "Upload your metadata CSV"}
          onCSV={this.onCSV}
          className={cx(cs.csvUpload, hasMetadata && cs.uploaded)}
        />
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
      project_id: PropTypes.number,
      host_genome_id: PropTypes.number
    })
  ),
  className: PropTypes.string,
  onMetadataChange: PropTypes.func.isRequired,
  samplesAreNew: PropTypes.bool,
  visible: PropTypes.bool,
  // Immediately called when the user changes anything, even before validation has returned.
  // Can be used to disable the header navigation.
  onDirty: PropTypes.func.isRequired
};

export default MetadataCSVUpload;
