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
import React from "react";

import {
  ANALYTICS_EVENT_NAMES,
  logAnalyticsEvent,
  withAnalytics,
} from "~/api/analytics";
import { getProjectMetadataFields } from "~/api/metadata";
import ProjectInfoIconTooltip from "~/components/common/ProjectInfoIconTooltip";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { formatFileSize } from "~/components/utils/format";
import PropTypes from "~/components/utils/propTypes";
import { WORKFLOWS } from "~/components/utils/workflows";
import DataTable from "~/components/visualizations/table/DataTable";
import Checkbox from "~ui/controls/Checkbox";
import TermsAgreement from "~ui/controls/TermsAgreement";
import { IconProjectPrivate, IconProjectPublic, IconSample } from "~ui/icons";
import { returnHipaaCompliantMetadata } from "~utils/metadata";
import AdminUploadOptions from "./AdminUploadOptions";
import HostOrganismMessage from "./HostOrganismMessage";
import UploadProgressModal from "./UploadProgressModal";
import {
  CG_WETLAB_DISPLAY_NAMES,
  CG_TECHNOLOGY_OPTIONS,
  CG_TECHNOLOGY_DISPLAY_NAMES,
} from "./constants";

import cs from "./sample_upload_flow.scss";

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
      const sampleHostName = get(
        "name",
        hostGenomesById[sample.host_genome_id]
      );
      let sampleMetadata = metadataBySample[sample.name];

      if (sampleHostName === "Human" && "Host Age" in sampleMetadata) {
        sampleMetadata["Host Age"] = returnHipaaCompliantMetadata(
          "host_age",
          sampleMetadata["Host Age"]
        );
      }

      const sampleData = {
        ...sampleMetadata,
        "Sample Name": <div className={cs.sampleName}>{sample.name}</div>,
        "Host Organism": sampleHostName,
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

  renderProjectInfo = () => {
    const { showLessDescription } = this.state;
    const { project, uploadType } = this.props;

    const shouldTruncateDescription =
      project.description && this.countNewLines(project.description) > 5;

    return (
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
                  uploadType,
                });
              }}
            >
              Edit Project
            </div>
          </div>
        </div>
        <div className={cs.section}>
          {project.public_access === 1 ? (
            <IconProjectPublic className={cs.icon} />
          ) : (
            <IconProjectPrivate className={cs.icon} />
          )}
          <div className={cs.text}>
            <div className={cs.header}>
              <div className={cs.name}>{project.name}</div>
              <div className={cs.publicAccess}>
                {project.public_access ? "Public Project" : "Private Project"}
              </div>
              <ProjectInfoIconTooltip
                isPublic={project.public_access === 1}
                // Offset required to align the carrot of the tooltip accurately on top of the IconInfoSmall.
                // This issue is caused by nested div containers being passed to the prop "content" in the BasicPopup component
                offset={[-7, 0]}
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
    );
  };

  renderAnalysisTypeInfo = () => {
    const {
      clearlabs,
      technology,
      medakaModel,
      project,
      uploadType,
      wetlabProtocol,
      workflows,
    } = this.props;

    const workflowType = workflows.has(WORKFLOWS.CONSENSUS_GENOME.value)
      ? "SARS-CoV-2 Consensus Genome"
      : "Metagenomics";

    return (
      <div className={cs.sectionContainer}>
        <div className={cs.reviewHeader}>
          <span className={cs.text}>Analysis Type Info</span>
          <div className={cx(cs.links, this.linksEnabled() && cs.enabled)}>
            <div
              className={cs.link}
              onClick={() => {
                this.onLinkClick("uploadSamples");
                logAnalyticsEvent(
                  ANALYTICS_EVENT_NAMES.REVIEW_STEP_EDIT_ANALYSIS_TYPE_LINK_CLICKED,
                  {
                    projectId: project.id,
                    projectName: project.name,
                    uploadType,
                  }
                );
              }}
            >
              Edit Analysis Type
            </div>
          </div>
        </div>
        <div className={cs.section}>
          <IconSample className={cs.icon} />
          <div className={cs.text}>
            <div className={cs.header}>
              <div className={cs.name}>{workflowType}</div>
            </div>
            <div className={cs.analysisTypeContent}>
              <div className={cs.item}>
                <div className={cs.subheader}>Sequencing Platform&#58;</div>
                <div className={cs.description}>
                  {/* Default to displaying "Illumina" for mNGS samples, which don't have
                  technology set as an input parameter. */}
                  {CG_TECHNOLOGY_DISPLAY_NAMES[technology] || "Illumina"}
                </div>
              </div>
              {technology === CG_TECHNOLOGY_OPTIONS.NANOPORE && (
                <div className={cs.item}>
                  <div className={cs.subheader}>Used Clear Labs&#58;</div>
                  <div className={cs.description}>
                    {clearlabs ? "Yes" : "No"}
                  </div>
                </div>
              )}
              {workflows.has(WORKFLOWS.CONSENSUS_GENOME.value) && (
                <div className={cs.item}>
                  <div className={cs.subheader}>Wetlab Protocol&#58;</div>
                  <div className={cs.description}>
                    {CG_WETLAB_DISPLAY_NAMES[wetlabProtocol]}
                  </div>
                </div>
              )}
              <div className={cs.item}>
                {technology === CG_TECHNOLOGY_OPTIONS.NANOPORE && (
                  <>
                    <div className={cs.subheader}>Medaka Model&#58;</div>
                    <div className={cs.description}>{medakaModel}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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

  renderSampleInfo = () => {
    const { adminOptions } = this.state;

    const { project, uploadType } = this.props;

    const { admin } = this.context || {};
    return (
      <div className={cs.sectionContainer}>
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
                  uploadType,
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
                  uploadType,
                });
              }}
            >
              Edit Metadata
            </div>
          </div>
        </div>
        <div className={cs.tableScrollWrapper}>{this.renderReviewTable()}</div>
        {admin && (
          <AdminUploadOptions
            adminOptions={adminOptions}
            onAdminOptionsChanged={this.handleAdminOptionsChanged}
          />
        )}
      </div>
    );
  };

  render() {
    const {
      adminOptions,
      consentChecked,
      showUploadModal,
      skipSampleProcessing,
      useStepFunctionPipeline,
    } = this.state;

    const {
      clearlabs,
      technology,
      medakaModel,
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

    const { userSettings } = this.context || {};

    return (
      <div
        className={cx(cs.reviewStep, cs.uploadFlowStep, visible && cs.visible)}
      >
        <div className={cs.flexContent}>
          {this.renderProjectInfo()}
          {this.renderAnalysisTypeInfo()}
          {this.renderSampleInfo()}
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
            />
          )}
          {showUploadModal && (
            <UploadProgressModal
              adminOptions={adminOptions}
              clearlabs={clearlabs}
              technology={technology}
              medakaModel={medakaModel}
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
        upload_client: PropTypes.string,
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
  clearlabs: PropTypes.bool,
  technology: PropTypes.string,
  medakaModel: PropTypes.string,
  workflows: PropTypes.instanceOf(Set),
  wetlabProtocol: PropTypes.string,
};

ReviewStep.contextType = UserContext;

export default ReviewStep;
