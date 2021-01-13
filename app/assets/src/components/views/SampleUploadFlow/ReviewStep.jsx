import React from "react";
import cx from "classnames";
import {
  flow,
  get,
  keyBy,
  map,
  mapKeys,
  mapValues,
  omit,
  without,
} from "lodash/fp";

import { WORKFLOWS } from "~/components/utils/workflows";
import { UserContext } from "~/components/common/UserContext";
import { getProjectMetadataFields } from "~/api/metadata";
import DataTable from "~/components/visualizations/table/DataTable";
import ProjectInfoIconTooltip from "~/components/common/ProjectInfoIconTooltip";
import PropTypes from "~/components/utils/propTypes";
import { formatFileSize } from "~/components/utils/format";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import TermsAgreement from "~ui/controls/TermsAgreement";
import Checkbox from "~ui/controls/Checkbox";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import { IconProjectPrivate, IconProjectPublic } from "~ui/icons";

import cs from "./sample_upload_flow.scss";
import UploadProgressModal from "./UploadProgressModal";
import HostOrganismMessage from "./HostOrganismMessage";
import AdminUploadOptions from "./AdminUploadOptions";

const processMetadataRows = metadataRows =>
  flow(
    keyBy(row => row.sample_name || row["Sample Name"]),
    mapValues(omit(["sample_name", "Sample Name"]))
  )(metadataRows);

class ReviewStep extends React.Component {
  state = {
    consentChecked: false,
    projectMetadataFields: null,
    showLessDescription: true,
    showUploadModal: false,
    skipSampleProcessing: false,
    useStepFunctionPipeline: true,
    adminOptions: {},
  };

  componentDidMount() {
    this.loadProjectMetadataFields();
  }

  loadProjectMetadataFields = async () => {
    const { project } = this.props;
    const projectMetadataFields = await getProjectMetadataFields(project.id);
    this.setState({
      projectMetadataFields: keyBy("key", projectMetadataFields),
    });
  };

  uploadSamplesAndMetadata = () => {
    const { onUploadStatusChange } = this.props;

    onUploadStatusChange(true);

    this.setState({
      showUploadModal: true,
    });

    this.setState({});
  };

  getFieldDisplayName = key => {
    const { projectMetadataFields } = this.state;
    return projectMetadataFields[key] ? projectMetadataFields[key].name : key;
  };

  getDataHeaders = () => {
    const { uploadType, metadata } = this.props;

    // Omit sample name, which is the first header.
    const metadataHeaders = without(
      ["Sample Name", "sample_name"],
      metadata.headers.map(this.getFieldDisplayName)
    );

    if (uploadType !== "basespace") {
      return [
        "Sample Name",
        "Input Files",
        "Host Organism",
        ...metadataHeaders,
      ];
    } else {
      return [
        "Sample Name",
        "Basespace Project",
        "File Size",
        "File Type",
        "Host Organism",
        ...metadataHeaders,
      ];
    }
  };

  getDataRows = () => {
    const { uploadType, metadata } = this.props;

    const metadataRows = metadata.rows.map(r =>
      mapKeys(this.getFieldDisplayName, r)
    );

    const metadataBySample = keyBy(
      row => row["Sample Name"] || row.sample_name,
      metadataRows
    );

    const hostGenomesById = keyBy("id", this.props.hostGenomes);

    const assembleDataForSample = sample => {
      const sampleData = {
        ...metadataBySample[sample.name],
        "Sample Name": <div className={cs.sampleName}>{sample.name}</div>,
        "Host Organism": get("name", hostGenomesById[sample.host_genome_id]),
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
        sampleData["File Size"] = formatFileSize(sample.file_size);
        sampleData["File Type"] = sample.file_type;
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
      case "Water Control":
        return 80;
      case "Nucleotide Type":
      case "Collection Date":
        return 100;
      default:
        return 140;
    }
  };

  toggleDisplayDescription = () => {
    this.setState(prevState => ({
      showLessDescription: !prevState.showLessDescription,
    }));
  };

  countNewLines = text => {
    // the code for newline in Windows is \r\n
    if (text) {
      return text.split(/\r*\n/).length;
    }
    return 0;
  };

  handleAdminOptionsChanged = adminOptions => {
    this.setState({ adminOptions });
  };

  toggleSkipSampleProcessing = () => {
    const { skipSampleProcessing } = this.state;
    this.setState({
      skipSampleProcessing: !skipSampleProcessing,
    });
  };

  // This is only for admins and QA testers.
  renderSkipSampleProcessingOption = () => {
    const { skipSampleProcessing } = this.state;
    return (
      <Checkbox
        className={cs.sampleProcessingOption}
        checked={skipSampleProcessing}
        onChange={this.toggleSkipSampleProcessing}
        label="Skip sample processing after upload is complete."
      />
    );
  };

  renderReviewTable = () => {
    const { projectMetadataFields } = this.state;

    if (!projectMetadataFields) {
      return <div className={cs.loadingMsg}>Loading...</div>;
    } else {
      return (
        <DataTable
          className={cs.metadataTable}
          columns={this.getDataHeaders()}
          data={this.getDataRows()}
          getColumnWidth={this.getColumnWidth}
        />
      );
    }
  };

  render() {
    const {
      adminOptions,
      consentChecked,
      showLessDescription,
      showUploadModal,
      skipSampleProcessing,
      useStepFunctionPipeline,
    } = this.state;

    const {
      metadata,
      onUploadComplete,
      originalHostGenomes,
      project,
      samples,
      uploadType,
      visible,
      wetlabProtocol,
      workflows,
    } = this.props;

    const shouldTruncateDescription =
      project.description && this.countNewLines(project.description) > 5;

    const { userSettings, allowedFeatures, admin } = this.context || {};

    return (
      <div
        className={cx(cs.reviewStep, cs.uploadFlowStep, visible && cs.visible)}
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
                      projectId: project.id,
                      projectName: project.name,
                      uploadType: uploadType,
                    });
                  }}
                >
                  Edit Project
                </div>
              </div>
            </div>
            <div className={cs.project}>
              {project.public_access === 1 ? (
                <IconProjectPublic className={cs.projectIcon} />
              ) : (
                <IconProjectPrivate className={cs.projectIcon} />
              )}
              <div className={cs.text}>
                <div className={cs.header}>
                  <div className={cs.name}>{project.name}</div>
                  <div className={cs.publicAccess}>
                    {project.public_access
                      ? "Public Project"
                      : "Private Project"}
                  </div>
                  <ProjectInfoIconTooltip
                    isPublic={project.public_access === 1}
                    // Offset required to align the carrot of the tooltip accurately on top of the IconInfoSmall.
                    // This issue is caused by nested div containers being passed to the prop "content" in the BasicPopup component
                    offset="-7px, 0px"
                    position="top left"
                  />
                </div>
                {project.description && (
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
                      {project.description}
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
                  {project.number_of_samples || 0} existing samples in project
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
                      projectId: project.id,
                      projectName: project.name,
                      uploadType: uploadType,
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
                      projectId: project.id,
                      projectName: project.name,
                      uploadType: uploadType,
                    });
                  }}
                >
                  Edit Metadata
                </div>
              </div>
            </div>
            <div className={cs.tableScrollWrapper}>
              {this.renderReviewTable()}
            </div>
            {admin && (
              <AdminUploadOptions
                adminOptions={adminOptions}
                onAdminOptionsChanged={this.handleAdminOptionsChanged}
              />
            )}
          </div>
        </div>
        <div className={cs.controls}>
          {workflows.has(WORKFLOWS.CONSENSUS_GENOME.value) || (
            <HostOrganismMessage
              hostGenomes={originalHostGenomes}
              samples={samples}
            />
          )}
          {get("show_skip_processing_option", userSettings) &&
            this.renderSkipSampleProcessingOption()}
          <TermsAgreement
            checked={consentChecked}
            onChange={() =>
              this.setState(
                {
                  consentChecked: !consentChecked,
                },
                () =>
                  logAnalyticsEvent("ReviewStep_consent-checkbox_checked", {
                    consentChecked: consentChecked,
                  })
              )
            }
          />
          {!showUploadModal && (
            <PrimaryButton
              text="Start Upload"
              disabled={!consentChecked}
              onClick={withAnalytics(
                this.uploadSamplesAndMetadata,
                "ReviewStep_start-upload-button_clicked",
                {
                  samples: samples.length,
                  uploadType: uploadType,
                }
              )}
              rounded={false}
            />
          )}
          {showUploadModal && (
            <UploadProgressModal
              adminOptions={adminOptions}
              metadata={processMetadataRows(metadata.rows)}
              onUploadComplete={onUploadComplete}
              project={project}
              samples={samples}
              skipSampleProcessing={skipSampleProcessing}
              uploadType={uploadType}
              useStepFunctionPipeline={useStepFunctionPipeline}
              wetlabProtocol={wetlabProtocol}
              workflows={workflows}
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
      host_genome_id: PropTypes.number.isRequired,
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
  originalHostGenomes: PropTypes.arrayOf(PropTypes.HostGenome),
  visible: PropTypes.bool,
  // Triggers when we start or stop uploading. Lets the parent know to disable header link.
  onUploadStatusChange: PropTypes.func,
  onStepSelect: PropTypes.func,
  onUploadComplete: PropTypes.func.isRequired,
  admin: PropTypes.bool,
  workflows: PropTypes.instanceOf(Set),
  wetlabProtocol: PropTypes.string,
};

ReviewStep.contextType = UserContext;

export default ReviewStep;
