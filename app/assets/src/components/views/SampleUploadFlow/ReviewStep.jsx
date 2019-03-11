import React from "react";
import { get, without, map, keyBy, flow, mapValues, omit } from "lodash/fp";

import DataTable from "~/components/visualizations/table/DataTable";
import PropTypes from "~/components/utils/propTypes";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import TermsAgreement from "~ui/controls/TermsAgreement";
import { bulkUploadLocalWithMetadata, bulkUploadRemote } from "~/api/upload";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import LoadingIcon from "~ui/icons/LoadingIcon";

import cs from "./sample_upload_flow.scss";

const processMetadataRows = metadataRows =>
  flow(keyBy("sample_name"), mapValues(omit("sample_name")))(metadataRows);

class ReviewStep extends React.Component {
  state = {
    consentChecked: false,
    submitState: "review"
  };

  uploadSamplesAndMetadata = () => {
    this.setState({
      submitState: "submitting",
      errorMessage: ""
    });
    // For uploading samples with files on S3
    if (this.props.uploadType === "remote") {
      bulkUploadRemote({
        samples: this.props.samples,
        metadata: processMetadataRows(this.props.metadata.rows)
      })
        .then(response => {
          this.setState({
            submitState: "success",
            createdSampleIds: response.sample_ids
          });
        })
        // TODO(mark): Display better errors.
        // For example, some samples may have successfully saved, but not others. Should explain to user.
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error("onBulkUploadRemote error:", error);
          this.setState({
            submitState: "review",
            errorMessage: "There were some issues creating your samples"
          });
        });
    }
    // For uploading samples with local files
    if (this.props.uploadType === "local") {
      // TODO(mark): Handle progress indicators in UI.
      bulkUploadLocalWithMetadata({
        samples: this.props.samples,
        sampleNamesToFiles: this.props.sampleNamesToFiles,
        metadata: processMetadataRows(this.props.metadata.rows),
        onAllUploadsComplete: () => {
          this.setState({
            submitState: "success"
          });
        },
        onCreateSamplesError: errors => {
          // TODO(mark): Display better errors.
          // eslint-disable-next-line no-console
          console.error("onCreateSamplesError:", errors);
          this.setState({
            submitState: "review",
            errorMessage: "There were some issues creating your samples"
          });
        },
        // TODO(mark): Display better errors.
        // For example, some samples may have successfuly saved, but not others. Should explain to user.
        onUploadError: (file, error) => {
          // eslint-disable-next-line no-console
          console.error("onUploadError:", error);
          this.setState({
            submitState: "review",
            errorMessage: "There were some issues creating your samples"
          });
        },
        onMarkSampleUploadedError: sampleName => {
          this.setState({
            submitState: "review",
            errorMessage: `Failed to mark sample ${sampleName} as uploaded`
          });
        }
      });
    }
  };

  getDataHeaders = () => {
    return [
      "Sample Name",
      "Input Files",
      "Host Genome",
      // Omit sample name, which is the first header.
      ...without(["Sample Name", "sample_name"], this.props.metadata.headers)
    ];
  };

  getDataRows = () => {
    const metadataBySample = keyBy(
      row => row["Sample Name"] || row.sample_name,
      this.props.metadata.rows
    );
    const hostGenomesById = keyBy("id", this.props.hostGenomes);

    return map(
      sample => ({
        ...metadataBySample[sample.name],
        "Sample Name": <div className={cs.sampleName}>{sample.name}</div>,
        "Host Genome": get("name", hostGenomesById[sample.host_genome_id]),
        "Input Files": (
          <div className={cs.files}>
            {sample.input_files_attributes.map(file => (
              <div key={file.source} className={cs.file}>
                {file.name || file.source}
              </div>
            ))}
          </div>
        )
      }),
      this.props.samples
    );
  };

  getColumnWidth = column => {
    switch (column) {
      case "Sample Name":
        return 200;
      case "Input Files":
        return 300;
      default:
        return 160;
    }
  };

  render() {
    return (
      <div className={cs.reviewStep}>
        <div className={cs.projectContainer}>
          <div className={cs.smallHeader}>Project Info</div>
          <div className={cs.project}>
            {this.props.project.public_access === 1 ? (
              <PublicProjectIcon className={cs.projectIcon} />
            ) : (
              <PrivateProjectIcon className={cs.projectIcon} />
            )}
            <div className={cs.text}>
              <div className={cs.header}>
                <div className={cs.name}>{this.props.project.name}</div>
                <div className={cs.publicAccess}>
                  {this.props.project.public_access
                    ? "Public Project"
                    : "Private Project"}
                </div>
              </div>
              <div className={cs.existingSamples}>
                {this.props.project.number_of_samples || 0} existing samples in
                project
              </div>
            </div>
          </div>
        </div>
        <div className={cs.sampleContainer}>
          <div className={cs.smallHeader}>Sample Info</div>
          <div className={cs.tableScrollWrapper}>
            <DataTable
              className={cs.metadataTable}
              columns={this.getDataHeaders()}
              data={this.getDataRows()}
              getColumnWidth={this.getColumnWidth}
            />
          </div>
        </div>
        {this.state.submitState === "review" && (
          <TermsAgreement
            checked={this.state.consentChecked}
            onChange={() =>
              this.setState({
                consentChecked: !this.state.consentChecked
              })
            }
          />
        )}
        <div className={cs.controls}>
          {this.state.submitState === "submitting" && (
            <div className={cs.uploadMessage}>
              <LoadingIcon className={cs.loadingIcon} />
              Upload in progress... Please keep this page open until
              completed...
            </div>
          )}
          {this.state.errorMessage && (
            <div className={cs.error}>{this.state.errorMessage}</div>
          )}
          {this.state.submitState === "success" && (
            <div>
              <div className={cs.successMessage}>
                Samples successfully uploaded to {this.props.project.name}.
              </div>
              <a
                className={cs.link}
                href={`/home?project_id=${this.props.project.id}`}
              >
                <SecondaryButton text="Go to Project" rounded={false} />
              </a>
            </div>
          )}
          {this.state.submitState === "review" && (
            <PrimaryButton
              text="Start Upload"
              disabled={!this.state.consentChecked}
              onClick={this.uploadSamplesAndMetadata}
              rounded={false}
            />
          )}
        </div>
      </div>
    );
  }
}

ReviewStep.propTypes = {
  metadata: PropTypes.shape({
    headers: PropTypes.arrayOf(PropTypes.string),
    rows: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any))
  }),
  project: PropTypes.Project,
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      host_genome_id: PropTypes.number,
      input_file_attributes: PropTypes.shape({
        name: PropTypes.string,
        source: PropTypes.string,
        source_type: PropTypes.string
      }),
      name: PropTypes.string,
      project_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string
    })
  ),
  uploadType: PropTypes.string.isRequired,
  sampleNamesToFiles: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.instanceOf(File))
  ),
  hostGenomes: PropTypes.arrayOf(PropTypes.HostGenome)
};

export default ReviewStep;
