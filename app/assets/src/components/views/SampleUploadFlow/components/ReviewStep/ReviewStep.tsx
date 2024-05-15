import cx from "classnames";
import { keyBy } from "lodash/fp";
import React, { useContext } from "react";
import {
  TrackEventType,
  useTrackEvent,
  useWithAnalytics,
  WithAnalyticsType,
} from "~/api/analytics";
import { getProjectMetadataFields } from "~/api/metadata";
import { TaxonOption } from "~/components/common/filters/types";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import UserContextType from "~/interface/allowedFeatures";
import {
  HostGenome,
  MetadataBasic,
  PipelineVersions,
  Project,
  SampleFromApi,
} from "~/interface/shared";
import { UploadStepType } from "~/interface/upload";
import TermsAgreement from "~ui/controls/TermsAgreement";
import { Technology, UploadWorkflows, UPLOAD_WORKFLOWS } from "../../constants";
import { UploadProgressModal } from "../UploadProgressModal";
import { RefSeqAccessionDataType } from "../UploadSampleStep/types";
import { AnalysesSections } from "./components/AnalysesSections";
import { HostOrganismMessage } from "./components/HostOrganismMessage";
import { ProjectInfo } from "./components/ProjectInfo";
import { ReviewHeader } from "./components/ReviewHeader";
import { SampleInfo } from "./components/SampleInfo";
import cs from "./review_step.scss";

interface ReviewStepProps {
  admin?: boolean;
  bedFile: File | null;
  clearlabs: boolean;
  guppyBasecallerSetting: string | null;
  hostGenomes?: HostGenome[];
  medakaModel: string | null;
  metadata: MetadataBasic | null;
  // Triggers when we start or stop uploading. Lets the parent know to disable header link.
  onUploadComplete: () => void;
  onUploadStatusChange?: $TSFixMeFunction;
  onStepSelect?(UploadStepType): void;
  originalHostGenomes?: HostGenome[];
  pipelineVersions: { [projectId: string]: PipelineVersions };
  project: Project;
  refSeqAccession: RefSeqAccessionDataType | null;
  refSeqFile: File | null;
  refSeqTaxon: TaxonOption | null;
  samples: SampleFromApi[] | null;
  uploadType: string;
  visible?: boolean;
  technology: Technology | null;
  workflows: Set<UploadWorkflows>;
  wetlabProtocol: string | null;
}

interface ReviewStepWithContextProps extends ReviewStepProps {
  userContext: UserContextType;
  trackEvent: TrackEventType;
  withAnalytics: WithAnalyticsType;
}

interface ReviewStepState {
  consentChecked: boolean;
  projectMetadataFields: object | null;
  showUploadModal: boolean;
  skipSampleProcessing: boolean;
  useStepFunctionPipeline: boolean;
  adminOptions: Record<string, string>;
}

class ReviewStepCC extends React.Component<
  ReviewStepWithContextProps,
  ReviewStepState
> {
  state: ReviewStepState = {
    consentChecked: false,
    projectMetadataFields: null,
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

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    onUploadStatusChange(true);

    this.setState({
      showUploadModal: true,
    });

    this.setState({});
  };

  onLinkClick = (link: UploadStepType) => {
    const areLinksEnabled = !this.state.showUploadModal;

    if (areLinksEnabled) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
      this.props.onStepSelect(link);
    }
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

  render() {
    const {
      adminOptions,
      consentChecked,
      projectMetadataFields,
      showUploadModal,
      skipSampleProcessing,
      useStepFunctionPipeline,
    } = this.state;

    const {
      bedFile,
      clearlabs,
      guppyBasecallerSetting,
      technology,
      hostGenomes,
      medakaModel,
      metadata,
      onUploadComplete,
      originalHostGenomes,
      pipelineVersions,
      refSeqAccession,
      refSeqFile,
      refSeqTaxon,
      project,
      samples,
      uploadType,
      visible,
      wetlabProtocol,
      workflows,
    } = this.props;

    const areLinksEnabled = !showUploadModal;

    return (
      <div
        className={cx(cs.reviewStep, cs.uploadFlowStep, visible && cs.visible)}
      >
        <div className={cs.flexContent}>
          <ProjectInfo
            areLinksEnabled={areLinksEnabled}
            onLinkClick={this.onLinkClick}
            uploadType={uploadType}
            project={project}
          />
          <div className={cs.sectionContainer}>
            <ReviewHeader
              areLinksEnabled={areLinksEnabled}
              onLinkClick={this.onLinkClick}
              project={project}
              uploadType={uploadType}
            />
            <AnalysesSections
              pipelineVersions={pipelineVersions}
              project={project}
              workflows={workflows}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              technology={technology}
              clearlabs={clearlabs}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              medakaModel={medakaModel}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              wetlabProtocol={wetlabProtocol}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              guppyBasecallerSetting={guppyBasecallerSetting}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              refSeqTaxon={refSeqTaxon?.name}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              refSeqFile={refSeqFile?.name}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              bedFile={bedFile?.name}
            />
          </div>
          <SampleInfo
            adminOptions={adminOptions}
            areLinksEnabled={areLinksEnabled}
            onAdminOptionsChanged={this.handleAdminOptionsChanged}
            onLinkClick={this.onLinkClick}
            project={project}
            uploadType={uploadType}
            hostGenomes={hostGenomes}
            metadata={metadata}
            projectMetadataFields={projectMetadataFields}
            samples={samples}
          />
        </div>
        <div className={cs.controls}>
          {workflows.has(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value) || ( // TODO (mlila): should be with viral cg as well?
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
            <HostOrganismMessage
              hostGenomes={originalHostGenomes}
              samples={samples}
            />
          )}
          <TermsAgreement
            checked={consentChecked}
            onChange={() =>
              this.setState({
                consentChecked: !consentChecked,
              })
            }
          />
          {!showUploadModal && (
            <PrimaryButton
              text="Start Upload"
              disabled={!consentChecked}
              onClick={this.uploadSamplesAndMetadata}
            />
          )}
          {showUploadModal && (
            <UploadProgressModal
              adminOptions={adminOptions}
              bedFile={bedFile}
              clearlabs={clearlabs}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              guppyBasecallerSetting={guppyBasecallerSetting}
              technology={technology}
              medakaModel={medakaModel}
              metadata={metadata}
              onUploadComplete={onUploadComplete}
              project={project}
              refSeqAccession={refSeqAccession}
              refSeqFile={refSeqFile}
              refSeqTaxon={refSeqTaxon}
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

// Using a function component wrapper provides a semi-hacky way to
// access useContext from multiple providers without the class component to function component
// conversion.
const ReviewStep = (props: ReviewStepProps) => {
  const trackEvent = useTrackEvent();
  const withAnalytics = useWithAnalytics();
  const userContext = useContext(UserContext);

  return (
    <ReviewStepCC
      {...props}
      trackEvent={trackEvent}
      withAnalytics={withAnalytics}
      userContext={userContext}
    />
  );
};

export default ReviewStep;
