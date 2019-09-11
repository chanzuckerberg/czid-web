import React from "react";
import cx from "classnames";
import { get, without, map, keyBy, flow, mapValues, omit } from "lodash/fp";

import DataTable from "~/components/visualizations/table/DataTable";
import PropTypes from "~/components/utils/propTypes";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import TermsAgreement from "~ui/controls/TermsAgreement";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import { formatFileSize } from "~/components/utils/format";

import cs from "./sample_upload_flow.scss";
import UploadProgressModal from "./UploadProgressModal";

const processMetadataRows = metadataRows =>
  flow(
    keyBy(row => row.sample_name || row["Sample Name"]),
    mapValues(omit(["sample_name", "Sample Name"]))
  )(metadataRows);

class ReviewStep extends React.Component {
  state = {
    consentChecked: false,
    showUploadModal: false,
    showLessDescription: true,
  };

  uploadSamplesAndMetadata = () => {
    const { onUploadStatusChange } = this.props;

    onUploadStatusChange(true);

    this.setState({
      showUploadModal: true,
    });

    this.setState({});
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

  linksEnabled = () => !this.state.showUploadModal;

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

  toggleDisplayDescription = () => {
    this.setState(prevState => ({
      showLessDescription: !prevState.showLessDescription,
    }));
  };

  countNewLines = text => {
    // the code for newline in Windows is \r\n
    return text.split(/\r*\n/).length;
  };

  render() {
    const { showUploadModal, showLessDescription } = this.state;
    const shouldTruncateDescription =
      this.props.project.description &&
      this.countNewLines(this.props.project.description) > 5;

    const {
      onUploadComplete,
      uploadType,
      samples,
      metadata,
      project,
    } = this.props;

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
                {this.props.project.description && (
                  <div className={cs.descriptionContainer}>
                    {/* Use showmore/showless pattern if description has many (>4) newlines. */}
                    {/* TODO(julie): Consider making a separate component to do this in a
                    less hacky way. */}
                    <div
                      className={cx(
                        shouldTruncateDescription &&
                          showLessDescription &&
                          cs.truncated
                      )}
                    >
                      {this.props.project.description}
                    </div>
                    {shouldTruncateDescription && (
                      <div
                        className={cs.showHide}
                        onClick={this.toggleDisplayDescription}
                      >
                        {showLessDescription ? "Show More" : "Show Less"}
                      </div>
                    )}
                  </div>
                )}
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
          {!showUploadModal && (
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
          {showUploadModal && (
            <UploadProgressModal
              samples={samples}
              uploadType={uploadType}
              onUploadComplete={onUploadComplete}
              metadata={processMetadataRows(metadata.rows)}
              project={project}
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
      files: PropTypes.objectOf(PropTypes.instanceOf(File)),
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
