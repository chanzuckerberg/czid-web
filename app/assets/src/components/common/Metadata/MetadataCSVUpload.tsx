// A CSV Upload component for uploading metadata.
// Sends uploaded to server for validation and displays errors and warnings.
import cx from "classnames";
import { map, isNull, isEqual } from "lodash/fp";
import React from "react";
import {
  validateMetadataCSVForProject,
  validateMetadataCSVForNewSamples,
} from "~/api/metadata";
import { CSV } from "~/interface/shared";
import CSVUpload from "~ui/controls/CSVUpload";
import cs from "./metadata_csv_upload.scss";
import { MetadataCSVUploadState, MetadataCSVUploadProps } from "./types";
import { processCSVMetadata } from "./utils";

class MetadataCSVUpload extends React.Component<
  MetadataCSVUploadProps,
  MetadataCSVUploadState
> {
  // MetadataCSVUpload stores each row as arrays of strings,
  // but converts the row to objects before calling onMetadataChange.
  state: MetadataCSVUploadState = {
    metadata: null,
    validatingCSV: false,
    // Keep track of the last sample names and project id validated so we can re-validate if the samples changed.
    lastSampleNamesValidated: null,
    lastProjectIdValidated: null,
  };

  componentDidUpdate(prevProps: MetadataCSVUploadProps) {
    // When the CSV Upload becomes visible again, validate the CSV if the samples have changed.
    if (
      !prevProps.visible &&
      this.props.visible &&
      this.state.metadata &&
      (!isEqual(
        map("name", this.props.samples),
        this.state.lastSampleNamesValidated,
      ) ||
        this.props.project.id !== this.state.lastProjectIdValidated)
    ) {
      this.validateCSV(this.state.metadata);
    }
  }

  onCSV = (csv: CSV) => {
    if (this.props.onDirty) {
      this.props.onDirty();
    }

    this.setState({ metadata: csv });
    this.validateCSV(csv);
  };

  validateCSV = async (csv: CSV) => {
    this.props.onMetadataChange({
      metadata: null,
      issues: {
        errors: [],
        warnings: [],
      },
      validatingCSV: true,
    });

    let serverResponse;

    // For uploading metadata together with new samples.
    if (this.props.samplesAreNew) {
      // We assume that all samples are being uploaded to this.props.project.
      this.setState({
        lastSampleNamesValidated: map("name", this.props.samples),
        lastProjectIdValidated: this.props.project.id,
      });

      serverResponse = await validateMetadataCSVForNewSamples(
        this.props.samples,
        csv,
      );
      // For uploading metadata to existing samples in a project.
    } else {
      serverResponse = await validateMetadataCSVForProject(
        this.props.project.id,
        csv,
      );
    }
    this.props.onMetadataChange({
      metadata: processCSVMetadata(csv),
      issues: serverResponse.issues,
      validatingCSV: false,
      newHostGenomes: serverResponse.newHostGenomes,
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
          removeEmptyRows
        />
      </div>
    );
  }
}

export default MetadataCSVUpload;
