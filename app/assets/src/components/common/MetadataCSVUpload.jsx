// A CSV Upload component for uploading metadata.
// Sends uploaded to server for validation and displays errors and warnings.
import React from "react";
import cx from "classnames";
import {
  filter,
  map,
  zip,
  fromPairs,
  isNull,
  isEqual,
  find,
  uniq,
} from "lodash/fp";
import PropTypes from "prop-types";

import { logAnalyticsEvent } from "~/api/analytics";
import {
  validateMetadataCSVForProject,
  validateMetadataCSVForNewSamples,
} from "~/api/metadata";
import { getURLParamString } from "~/helpers/url";
import CSVUpload from "~ui/controls/CSVUpload";

import MetadataInput from "./MetadataInput";
import cs from "./metadata_csv_upload.scss";

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
    ),
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
    lastProjectIdValidated: null,
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
    this.geosearchCSVlocations();
  };

  validateCSV = async csv => {
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
      validatingCSV: false,
    });
  };

  getCSVUrl = () => {
    const params = {
      ...(this.props.samplesAreNew
        ? { new_sample_names: map("name", this.props.samples) }
        : {}),
      project_id: this.props.project.id,
    };
    return `/metadata/metadata_template_csv?${getURLParamString(params)}`;
  };

  geosearchCSVlocations = () => {
    console.log("geosearchCSVlocations was called");
    const { projectMetadataFields } = this.props;
    const { metadata } = this.state;

    if (!(metadata && metadata.rows)) return;

    const locationField = find(
      { is_required: 1, dataType: "location" },
      Object.values(projectMetadataFields)
    );
    const fieldIndex = metadata.headers.indexOf(locationField.name);

    const originalValues = uniq(metadata.rows.map(r => r[fieldIndex]));
    console.log("original values:", originalValues);
  };

  renderLocationsInterface = () => {
    const { samples, onMetadataChange, projectMetadataFields } = this.props;
    const { metadata } = this.state;
    console.log("our metadata: ", metadata);

    const locationField = find(
      { is_required: 1, dataType: "location" },
      Object.values(projectMetadataFields)
    );
    console.log("location field: ", locationField);

    const sampleNames = new Set(map("name", samples) || []);
    console.log("sample names: ", sampleNames);

    if (!(metadata && metadata.rows)) return;

    const fieldIndex = metadata.headers.indexOf(locationField.name);

    // Render results
    return (
      metadata &&
      metadata.rows &&
      metadata.rows.map((row, rowIndex) => {
        if (!sampleNames.has(row[0])) return;

        return (
          <div>
            <span>{row[0]}</span>
            <span>
              <MetadataInput
                key={locationField.key}
                className={cs.input}
                value={row[fieldIndex]}
                metadataType={projectMetadataFields[locationField.key]}
                onChange={(key, value) => {
                  const newMetadata = metadata;
                  newMetadata.rows[rowIndex][fieldIndex] = value;

                  this.setState({ metadata: newMetadata });
                  onMetadataChange({
                    metadata: processCSVMetadata(newMetadata),
                  });

                  // Log analytics?
                }}
                withinModal={true}
                isHuman={true}
              />
            </span>
          </div>
        );
      })
    );
  };

  render() {
    const hasMetadata = !isNull(this.state.metadata);
    return (
      <React.Fragment>
        <div className={cx(cs.metadataCSVUpload, this.props.className)}>
          <CSVUpload
            title={hasMetadata ? "" : "Upload your metadata CSV"}
            onCSV={this.onCSV}
            className={cx(cs.csvUpload, hasMetadata && cs.uploaded)}
          />
        </div>
        <a
          className={cs.link}
          href={this.getCSVUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            logAnalyticsEvent("MetadataUpload_download-csv-template_clicked", {
              projectId: this.props.project.id,
              projectName: this.props.project.name,
            })
          }
        >
          Download Metadata CSV Template
        </a>
        {this.renderLocationsInterface()}
      </React.Fragment>
    );
  }
}

MetadataCSVUpload.propTypes = {
  // For uploading metadata to existing samples in a project.
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
  // For uploading metadata together with new samples.
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      project_id: PropTypes.number,
      host_genome_id: PropTypes.number,
    })
  ),
  className: PropTypes.string,
  onMetadataChange: PropTypes.func.isRequired,
  samplesAreNew: PropTypes.bool,
  visible: PropTypes.bool,
  // Immediately called when the user changes anything, even before validation has returned.
  // Can be used to disable the header navigation.
  onDirty: PropTypes.func.isRequired,
  projectMetadataFields: PropTypes.object,
};

export default MetadataCSVUpload;
