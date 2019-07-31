import React from "react";
import cx from "classnames";
import {
  pick,
  get,
  without,
  map,
  keyBy,
  flow,
  mapValues,
  omit,
} from "lodash/fp";

import DataTable from "~/components/visualizations/table/DataTable";
import PropTypes from "~/components/utils/propTypes";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import SecondaryButton from "~/components/ui/controls/buttons/SecondaryButton";
import TermsAgreement from "~ui/controls/TermsAgreement";
import {
  bulkUploadLocalWithMetadata,
  bulkUploadRemote,
  bulkUploadBasespace,
} from "~/api/upload";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import LoadingIcon from "~ui/icons/LoadingIcon";
import { formatFileSize } from "~/components/utils/format";

import cs from "./sample_upload_flow.scss";

const BASESPACE_SAMPLE_FIELDS = [
  "name",
  "project_id",
  "host_genome_id",
  "basespace_access_token",
  "basespace_dataset_id",
];

const REVIEWSTEP_UPLOAD_FAILED = "ReviewStep_upload_failed";
const REVIEWSTEP_UPLOAD_SUCCEEDED = "ReviewStep_upload_succeeded";

const processMetadataRows = metadataRows =>
  flow(
    keyBy(row => row.sample_name || row["Sample Name"]),
    mapValues(omit(["sample_name", "Sample Name"]))
  )(metadataRows);

class ReviewStep extends React.Component {
  state = {
    consentChecked: false,
    submitState: "review",
  };

  onUploadError = error => {
    this.setState({
      submitState: "review",
      errorMessage: error,
    });
    this.props.onUploadStatusChange(false);
  };

  uploadSamplesAndMetadata = () => {
    const {
      onUploadStatusChange,
      onUploadComplete,
      uploadType,
      samples,
      metadata,
    } = this.props;

    onUploadStatusChange(true);

    this.setState({
      submitState: "submitting",
      errorMessage: "",
    });

    // For uploading samples with files on S3 or Basespace
    if (uploadType === "remote" || uploadType === "basespace") {
      let bulkUploadFn = bulkUploadRemote;
      let bulkUploadFnName = "bulkUploadRemote";
      let samplesToUpload = samples;

      if (uploadType === "basespace") {
        bulkUploadFn = bulkUploadBasespace;
        bulkUploadFnName = "bulkUploadBasespace";
        samplesToUpload = map(pick(BASESPACE_SAMPLE_FIELDS), samplesToUpload);
      }

      bulkUploadFn({
        samples: samplesToUpload,
        metadata: processMetadataRows(metadata.rows),
      })
        .then(response => {
          this.setState({
            submitState: "success",
            createdSampleIds: response.sample_ids,
          });
          onUploadComplete();
          logAnalyticsEvent(REVIEWSTEP_UPLOAD_SUCCEEDED, {
            createdSampleIds: response.sample_ids.length,
            uploadType,
          });
        })
        // TODO(mark): Display better errors.
        // For example, some samples may have successfully saved, but not others. Should explain to user.
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error(`${bulkUploadFnName} error:`, error);
          this.onUploadError("There were some issues creating your samples.");
          logAnalyticsEvent(REVIEWSTEP_UPLOAD_FAILED, {
            error,
            uploadType,
          });
        });
    }
    // For uploading samples with local files
    if (uploadType === "local") {
      // TODO(mark): Handle progress indicators in UI.
      bulkUploadLocalWithMetadata({
        samples,
        metadata: processMetadataRows(metadata.rows),
        onAllUploadsComplete: () => {
          this.setState({
            submitState: "success",
          });
          onUploadComplete();
          logAnalyticsEvent(REVIEWSTEP_UPLOAD_SUCCEEDED, {
            samples: samples.length,
            uploadType,
          });
        },
        onCreateSamplesError: errors => {
          // TODO(mark): Display better errors.
          // eslint-disable-next-line no-console
          console.error("onCreateSamplesError:", errors);
          this.onUploadError("There were some issues creating your samples.");
          logAnalyticsEvent(REVIEWSTEP_UPLOAD_FAILED, {
            errors: errors.length,
            uploadType,
          });
        },
        // TODO(mark): Display better errors.
        // For example, some samples may have successfuly saved, but not others. Should explain to user.
        onUploadError: (file, error) => {
          // eslint-disable-next-line no-console
          console.error("onUploadError:", error);
          this.onUploadError("There were some issues creating your samples.");
          logAnalyticsEvent(REVIEWSTEP_UPLOAD_FAILED, {
            fileName: file.name,
            error,
            uploadType,
          });
        },
        onMarkSampleUploadedError: sampleName => {
          this.onUploadError(
            `Failed to mark sample ${sampleName} as uploaded.`
          );
          logAnalyticsEvent(REVIEWSTEP_UPLOAD_FAILED, {
            sampleName,
            uploadType,
          });
        },
      });
    }
  };

  getDataHeaders = () => {
    const { uploadType } = this.props;
    // Omit sample name, which is the first header.
    const metadataHeaders = without(
      ["Sample Name", "sample_name"],
      this.props.metadata.headers
    );
    if (uploadType !== "basespace") {
      return ["Sample Name", "Input Files", "Host Genome", ...metadataHeaders];
    } else {
      return [
        "Sample Name",
        "Basespace Project",
        "File Size",
        "File Type",
        "Host Genome",
        ...metadataHeaders,
      ];
    }
  };

  getDataRows = () => {
    const { uploadType } = this.props;
    const metadataBySample = keyBy(
      row => row["Sample Name"] || row.sample_name,
      this.props.metadata.rows
    );
    const hostGenomesById = keyBy("id", this.props.hostGenomes);

    const assembleDataForSample = sample => {
      const sampleData = {
        ...metadataBySample[sample.name],
        "Sample Name": <div className={cs.sampleName}>{sample.name}</div>,
        "Host Genome": get("name", hostGenomesById[sample.host_genome_id]),
      };

      // We display different columns if the uploadType is basespace.
      if (uploadType !== "basespace") {
        sampleData["Input Files"] = (
          <div className={cs.files}>
            {sample.input_files_attributes.map(file => (
              <div key={file.source} className={cs.file}>
                {file.name || file.source}
              </div>
            ))}
          </div>
        );
      } else {
        (sampleData["File Size"] = formatFileSize(sample.file_size)),
          (sampleData["File Type"] = sample.file_type);
        sampleData["Basespace Project"] = sample.basespace_project_name;
      }

      return sampleData;
    };

    return map(assembleDataForSample, this.props.samples);
  };

  linksEnabled = () => this.state.submitState === "review";

  onLinkClick = link => {
    if (this.linksEnabled()) {
      this.props.onStepSelect(link);
    }
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
      <div
        className={cx(
          cs.reviewStep,
          cs.uploadFlowStep,
          this.props.visible && cs.visible
        )}
      >
        <div className={cs.flexContent}>
          <div className={cs.projectContainer}>
            <div className={cs.reviewHeader}>
              <span className={cs.text}>Project Info</span>
              <div className={cx(cs.links, this.linksEnabled() && cs.enabled)}>
                <div
                  className={cs.link}
                  onClick={() => {
                    this.onLinkClick("uploadSamples");
                    logAnalyticsEvent("ReviewStep_edit-project-link_clicked", {
                      projectId: this.props.project.id,
                      projectName: this.props.project.name,
                      uploadType: this.props.uploadType,
                    });
                  }}
                >
                  Edit Project
                </div>
              </div>
            </div>
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
                  {this.props.project.number_of_samples || 0} existing samples
                  in project
                </div>
              </div>
            </div>
          </div>
          <div className={cs.sampleContainer}>
            <div className={cs.reviewHeader}>
              <span className={cs.text}>Sample Info</span>
              <div className={cx(cs.links, this.linksEnabled() && cs.enabled)}>
                <div
                  className={cs.link}
                  onClick={() => {
                    this.onLinkClick("uploadSamples");
                    logAnalyticsEvent("ReviewStep_edit-samples-link_clicked", {
                      projectId: this.props.project.id,
                      projectName: this.props.project.name,
                      uploadType: this.props.uploadType,
                    });
                  }}
                >
                  Edit Samples
                </div>
                <div className={cs.divider}>|</div>
                <div
                  className={cs.link}
                  onClick={() => {
                    this.onLinkClick("uploadMetadata");
                    logAnalyticsEvent("ReviewStep_edit-metadata-link_clicked", {
                      projectId: this.props.project.id,
                      projectName: this.props.project.name,
                      uploadType: this.props.uploadType,
                    });
                  }}
                >
                  Edit Metadata
                </div>
              </div>
            </div>
            <div className={cs.tableScrollWrapper}>
              <DataTable
                className={cs.metadataTable}
                columns={this.getDataHeaders()}
                data={this.getDataRows()}
                getColumnWidth={this.getColumnWidth}
              />
            </div>
          </div>
        </div>
        <div className={cs.controls}>
          {this.state.submitState === "review" && (
            <TermsAgreement
              checked={this.state.consentChecked}
              onChange={() =>
                this.setState(
                  {
                    consentChecked: !this.state.consentChecked,
                  },
                  () =>
                    logAnalyticsEvent("ReviewStep_consent-checkbox_checked", {
                      consentChecked: this.state.consentChecked,
                    })
                )
              }
            />
          )}
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
                <SecondaryButton
                  text="Go to Project"
                  rounded={false}
                  onClick={() =>
                    logAnalyticsEvent(
                      "ReviewStep_go-to-project-button_clicked",
                      {
                        projectId: this.props.project.id,
                        projectName: this.props.project.name,
                      }
                    )
                  }
                />
              </a>
            </div>
          )}
          {this.state.submitState === "review" && (
            <PrimaryButton
              text="Start Upload"
              disabled={!this.state.consentChecked}
              onClick={withAnalytics(
                this.uploadSamplesAndMetadata,
                "ReviewStep_start-upload-button_clicked",
                {
                  samples: this.props.samples.length,
                  uploadType: this.props.uploadType,
                }
              )}
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
    rows: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)),
  }),
  project: PropTypes.Project,
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      host_genome_id: PropTypes.number,
      input_file_attributes: PropTypes.shape({
        name: PropTypes.string,
        source: PropTypes.string,
        source_type: PropTypes.string,
      }),
      name: PropTypes.string,
      project_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
      // Basespace samples only.
      file_size: PropTypes.number,
      file_type: PropTypes.string,
      basespace_project_name: PropTypes.string,
      files: PropTypes.objectOf(PropTypes.objectOf(PropTypes.instanceOf(File))),
    })
  ),
  uploadType: PropTypes.string.isRequired,
  hostGenomes: PropTypes.arrayOf(PropTypes.HostGenome),
  visible: PropTypes.bool,
  // Triggers when we start or stop uploading. Lets the parent know to disable header link.
  onUploadStatusChange: PropTypes.func,
  onStepSelect: PropTypes.func,
  onUploadComplete: PropTypes.func.isRequired,
};

export default ReviewStep;
