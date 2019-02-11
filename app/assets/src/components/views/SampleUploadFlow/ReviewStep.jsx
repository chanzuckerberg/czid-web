import React from "react";
import { get, keyBy, flow, mapValues, omit } from "lodash/fp";
import DataTable from "~/components/visualizations/table/DataTable";
import PropTypes from "~/components/utils/propTypes";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import TermsAgreement from "~ui/controls/TermsAgreement";
import { bulkUploadLocalWithMetadata, bulkUploadRemote } from "~/api/upload";
import { joinServerError } from "~utils/sample";
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
    if (this.props.remoteSamples) {
      bulkUploadRemote({
        samples: this.props.remoteSamples,
        metadata: processMetadataRows(this.props.metadata.rows)
      })
        .then(response => {
          this.setState({
            submitState: "success",
            createdSampleIds: response.sample_ids
          });
        })
        // TODO(mark): Display better errors.
        // For example, some samples may have successfuly saved, but not others. Should explain to user.
        .catch(error => {
          this.setState({
            submitState: "review",
            errorMessage:
              get("data.status", error) ||
              "Unable to process sample(s), " +
                "ensure sample is not a duplicate in the selected project"
          });
        });
    }
    // For uploading samples with local files
    if (this.props.localSampleNamesToFiles) {
      // TODO(mark): Handle progress indicators in UI.
      bulkUploadLocalWithMetadata({
        sampleNamesToFiles: this.props.localSampleNamesToFiles,
        project: this.props.project,
        hostId: this.props.hostGenomeId,
        metadata: processMetadataRows(this.props.metadata.rows),
        onAllUploadsComplete: () => {
          this.setState({
            submitState: "success"
          });
        },
        onCreateSamplesError: errors => {
          this.setState({
            submitState: "review",
            errorMessage: errors ? errors.join(" ") : "Failed to create samples"
          });
        },
        // TODO(mark): Display better errors.
        // For example, some samples may have successfuly saved, but not others. Should explain to user.
        onUploadError: (file, error) => {
          const uploadError = `${file.name}: ${joinServerError(
            error.response.data
          )}`;

          this.setState({
            submitState: "review",
            errorMessage: this.state.errorMessage
              ? `${this.state.errorMessage}\n${uploadError}`
              : uploadError
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

  render() {
    return (
      <div className={cs.reviewStep}>
        <div className={cs.title}>Review</div>
        <DataTable
          className={cs.metadataTable}
          columns={this.props.metadata.headers}
          data={this.props.metadata.rows}
          columnWidth={120}
        />
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
  metadata: PropTypes.object,
  project: PropTypes.Project,
  remoteSamples: PropTypes.arrayOf(
    PropTypes.shape({
      host_genome_id: PropTypes.number,
      input_file_attributes: PropTypes.shape({
        name: PropTypes.string,
        source: PropTypes.string,
        source_type: PropTypes.string
      }),
      name: PropTypes.string,
      project_id: PropTypes.string,
      status: PropTypes.string
    })
  ),
  onContinue: PropTypes.func.isRequired,
  localSampleNamesToFiles: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.instanceOf(File))
  ),
  hostGenomeId: PropTypes.number
};

export default ReviewStep;
