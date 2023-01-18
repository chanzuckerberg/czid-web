import cx from "classnames";
import { Icon } from "czifui";
import { compact, flatten, get, keyBy, map, mapKeys, without } from "lodash/fp";
import React from "react";

import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { getProjectMetadataFields } from "~/api/metadata";
import ProjectInfoIconTooltip from "~/components/common/ProjectInfoIconTooltip";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import StatusLabel from "~/components/ui/labels/StatusLabel";
import { formatFileSize } from "~/components/utils/format";
import { WORKFLOWS } from "~/components/utils/workflows";
import DataTable from "~/components/visualizations/table/DataTable";
import { HostGenome, Project, SampleFromApi } from "~/interface/shared";
import Checkbox from "~ui/controls/Checkbox";
import TermsAgreement from "~ui/controls/TermsAgreement";
import { returnHipaaCompliantMetadata } from "~utils/metadata";
import AdminUploadOptions from "./AdminUploadOptions";
import HostOrganismMessage from "./HostOrganismMessage";
import UploadProgressModal from "./UploadProgressModal";
import {
  CG_WETLAB_DISPLAY_NAMES,
  CG_TECHNOLOGY_DISPLAY_NAMES,
  NANOPORE,
  WORKFLOW_DISPLAY_NAMES,
  WORKFLOW_ICONS,
} from "./constants";

import cs from "./sample_upload_flow.scss";

interface ReviewStepProps {
  metadata?: {
    headers?: string[];
    rows?: Record<string, any>[];
  };
  project?: Project;
  samples?: SampleFromApi[];
  uploadType: string;
  hostGenomes?: HostGenome[];
  originalHostGenomes?: HostGenome[];
  visible?: boolean;
  // Triggers when we start or stop uploading. Lets the parent know to disable header link.
  onUploadStatusChange?: $TSFixMeFunction;
  onStepSelect?: $TSFixMeFunction;
  onUploadComplete: $TSFixMeFunction;
  admin?: boolean;
  clearlabs?: boolean;
  technology?: string;
  medakaModel?: string;
  guppyBasecallerSetting?: string;
  workflows?: Set<string>;
  wetlabProtocol?: string;
}

interface ReviewStepState {
  consentChecked: boolean;
  projectMetadataFields: $TSFixMeUnknown;
  showLessDescription: boolean;
  showUploadModal: boolean;
  skipSampleProcessing: boolean;
  useStepFunctionPipeline: boolean;
  adminOptions: Record<string, string>;
}

class ReviewStep extends React.Component<ReviewStepProps, ReviewStepState> {
  state: ReviewStepState = {
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

  getFieldDisplayName = (key: string) => {
    const { projectMetadataFields } = this.state;
    return projectMetadataFields[key] ? projectMetadataFields[key].name : key;
  };

  getDataHeaders = () => {
    const { uploadType, metadata } = this.props;

    // Omit sample name, which is the first header.
    const metadataHeaders = without(
      ["Sample Name", "sample_name"],
      metadata.headers.map(this.getFieldDisplayName),
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
      mapKeys(this.getFieldDisplayName, r),
    );

    const metadataBySample = keyBy(
      row => row["Sample Name"] || row.sample_name,
      metadataRows,
    );

    const hostGenomesById = keyBy("id", this.props.hostGenomes);

    const assembleDataForSample = (sample: SampleFromApi) => {
      const sampleHostName = get(
        "name",
        hostGenomesById[sample.host_genome_id],
      );
      const sampleMetadata = metadataBySample[sample.name];

      if (sampleHostName === "Human" && "Host Age" in sampleMetadata) {
        sampleMetadata["Host Age"] = returnHipaaCompliantMetadata(
          "host_age",
          sampleMetadata["Host Age"],
        );
      }

      const sampleData = {
        ...sampleMetadata,
        "Sample Name": <div className={cs.sampleName}>{sample.name}</div>,
        "Host Organism": sampleHostName,
      };

      // We display different columns if the uploadType is basespace.
      if (uploadType !== "basespace") {
        // Display the concatenated file names here too
        const files = flatten(
          sample.input_files_attributes.map(pair => pair.concatenated),
        );
        sampleData["Input Files"] = (
          <div className={cs.files}>
            {files.map(file => (
              <div key={file} className={cs.file}>
                {file}
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

  onLinkClick = (link: string) => {
    if (this.linksEnabled()) {
      this.props.onStepSelect(link);
    }
  };

  getColumnWidth = (column: string) => {
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

  countNewLines = (text?: string) => {
    // the code for newline in Windows is \r\n
    if (text) {
      return text.split(/\r*\n/).length;
    }
    return 0;
  };

  handleAdminOptionsChanged = (
    adminOptions: ReviewStepState["adminOptions"],
  ) => {
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
                trackEvent("ReviewStep_edit-project-link_clicked", {
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
            <div className={cs.icon}>
              <Icon sdsIcon="projectPublic" sdsSize="xl" sdsType="static" />
            </div>
          ) : (
            <div className={cs.icon}>
              <Icon sdsIcon="projectPrivate" sdsSize="xl" sdsType="static" />
            </div>
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
                // @ts-expect-error Property 'offset' does not exist on type
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
                      cs.truncated,
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

  renderReviewHeader = () => {
    const { project, uploadType } = this.props;

    return (
      <div className={cs.reviewHeader}>
        <span className={cs.text}>Analysis Type Info</span>
        <div className={cx(cs.links, this.linksEnabled() && cs.enabled)}>
          <div
            className={cs.link}
            onClick={() => {
              this.onLinkClick("uploadSamples");
              trackEvent(
                ANALYTICS_EVENT_NAMES.REVIEW_STEP_EDIT_ANALYSIS_TYPE_LINK_CLICKED,
                {
                  projectId: project.id,
                  projectName: project.name,
                  uploadType,
                },
              );
            }}
          >
            Edit Analysis Type
          </div>
        </div>
      </div>
    );
  };

  renderAnalysesSections = () => {
    const { technology } = this.props;

    const sections = map(workflow => {
      const workflowDisplayName = WORKFLOW_DISPLAY_NAMES[workflow];
      const hasAnalysisTypeContent =
        workflow === WORKFLOWS.SHORT_READ_MNGS.value ||
        workflow === WORKFLOWS.CONSENSUS_GENOME.value;
      const workflowIsBeta = workflow === WORKFLOWS.AMR.value;
      const sequencingPlatformIsBeta =
        workflow === WORKFLOWS.SHORT_READ_MNGS.value && technology === NANOPORE;

      return (
        <div className={cs.section}>
          <div className={cs.icon}>
            <Icon
              sdsIcon={WORKFLOW_ICONS[workflow]}
              sdsSize="xl"
              sdsType="static"
            />
          </div>
          <div className={cs.text}>
            <div className={cs.header}>
              <div className={cs.name}>{workflowDisplayName}</div>
              {workflowIsBeta && (
                <StatusLabel inline status="Beta" type="beta" />
              )}
            </div>
            {hasAnalysisTypeContent && (
              <div className={cs.analysisTypeContent}>
                <div className={cs.item}>
                  <div className={cs.subheader}>{"Sequencing Platform: "}</div>
                  <div className={cs.description}>
                    {/* TODO: we should probably update this constant, now that technology display names
                    are relevant for CG and mNGS. The default technology of Illumina can be deleted once
                    ONT v1 is launched to all users. */}
                    {CG_TECHNOLOGY_DISPLAY_NAMES[technology] || "Illumina"}
                    {sequencingPlatformIsBeta && (
                      <StatusLabel inline status="Beta" type="beta" />
                    )}
                  </div>
                </div>
                {workflow === WORKFLOWS.CONSENSUS_GENOME.value &&
                  this.renderCGAnalysisSection()}
                {workflow === WORKFLOWS.SHORT_READ_MNGS.value &&
                  this.renderMngsAnalysisSection()}
              </div>
            )}
          </div>
        </div>
      );
    }, this.getWorkflowSectionOrder());
    return sections;
  };

  renderCGAnalysisSection = () => {
    const {
      clearlabs,
      medakaModel,
      technology,
      wetlabProtocol,
      workflows,
    } = this.props;
    return (
      <>
        {technology === NANOPORE && (
          <div className={cs.item}>
            <div className={cs.subheader}>Used Clear Labs&#58;</div>
            <div className={cs.description}>{clearlabs ? "Yes" : "No"}</div>
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
          {technology === NANOPORE && (
            <>
              <div className={cs.subheader}>Medaka Model&#58;</div>
              <div className={cs.description}>{medakaModel}</div>
            </>
          )}
        </div>
      </>
    );
  };

  renderMngsAnalysisSection = () => {
    const { technology, guppyBasecallerSetting } = this.props;
    return (
      <>
        {technology === NANOPORE && (
          <>
            <div className={cs.item}>
              <div className={cs.subheader}>{"Guppy Basecaller Setting: "}</div>
              <div className={cs.description}>{guppyBasecallerSetting}</div>
            </div>
            {/* Empty item for spacing purposes */}
            <div className={cs.item}></div>
          </>
        )}
      </>
    );
  };

  getWorkflowSectionOrder = () => {
    const { workflows } = this.props;

    const mngs = WORKFLOWS.SHORT_READ_MNGS.value;
    const amr = WORKFLOWS.AMR.value;
    const cg = WORKFLOWS.CONSENSUS_GENOME.value;

    return compact([
      workflows.has(mngs) && mngs,
      workflows.has(amr) && amr,
      workflows.has(cg) && cg,
    ]);
  };

  renderAnalysisTypeInfo = () => {
    return (
      <div className={cs.sectionContainer}>
        {this.renderReviewHeader()}
        {this.renderAnalysesSections()}
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
                trackEvent("ReviewStep_edit-samples-link_clicked", {
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
                trackEvent("ReviewStep_edit-metadata-link_clicked", {
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
      guppyBasecallerSetting,
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
                  trackEvent("ReviewStep_consent-checkbox_checked", {
                    consentChecked: consentChecked,
                  }),
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
                },
              )}
            />
          )}
          {showUploadModal && (
            <UploadProgressModal
              adminOptions={adminOptions}
              clearlabs={clearlabs}
              guppyBasecallerSetting={guppyBasecallerSetting}
              technology={technology}
              medakaModel={medakaModel}
              metadata={metadata}
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

ReviewStep.contextType = UserContext;

export default ReviewStep;
