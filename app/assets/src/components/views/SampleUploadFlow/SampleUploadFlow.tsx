import cx from "classnames";
import { find, flow, get, min, omit, set, without } from "lodash/fp";
import React from "react";
import { getProjectPipelineVersions } from "~/api";
import { TaxonOption } from "~/components/common/filters/types";
import {
  FIELDS_THAT_HAVE_MAX_INPUT,
  HOST_GENOME_SYNONYMS,
} from "~/components/common/Metadata/constants";
import NarrowContainer from "~/components/layout/NarrowContainer";
import {
  HostGenome,
  MetadataBasic,
  PipelineVersions,
  Project,
  SampleFromApi,
} from "~/interface/shared";
import { UploadStepType } from "~/interface/upload";
import { ReviewStep } from "./components/ReviewStep";
import { RefSeqAccessionDataType } from "./components/UploadSampleStep/types";
import UploadSampleStep from "./components/UploadSampleStep/UploadSampleStep";
import { Technology, UploadWorkflows } from "./constants";
import cs from "./sample_upload_flow.scss";
import SampleUploadFlowHeader from "./SampleUploadFlowHeader";
import UploadMetadataStep from "./UploadMetadataStep";

interface SampleUploadFlowProps {
  csrf?: string;
  hostGenomes?: HostGenome[];
  admin?: boolean;
  biohubS3UploadEnabled?: boolean;
  basespaceClientId: string;
  basespaceOauthRedirectUri: string;
}

interface SampleUploadFlowState {
  workflows: Set<UploadWorkflows>;
  currentStep: UploadStepType;
  samples?: SampleFromApi[];
  uploadType: "remote" | "local" | "";
  project: Project;
  sampleNamesToFiles: $TSFixMeUnknown;
  bedFile?: File;
  refSeqAccession?: RefSeqAccessionDataType;
  refSeqFile?: File;
  refSeqTaxon?: TaxonOption;
  clearlabs: boolean;
  guppyBasecallerSetting?: string;
  medakaModel: string;
  metadata?: MetadataBasic;
  metadataIssues: $TSFixMeUnknown;
  pipelineVersions: { [projectId: string]: PipelineVersions };
  latestMajorPipelineVersions: PipelineVersions;
  technology?: Technology;
  stepsEnabled: {
    [UploadStepType.SampleStep]: boolean;
    [UploadStepType.MetadataStep]: boolean;
    [UploadStepType.ReviewStep]: boolean;
  };
  hostGenomes: HostGenome[];
  wetlabProtocol?: string;
}

class SampleUploadFlow extends React.Component<SampleUploadFlowProps> {
  state: SampleUploadFlowState = {
    currentStep: UploadStepType.SampleStep,
    // Sample upload information
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    samples: null,
    uploadType: "", // remote or local
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    project: null,
    sampleNamesToFiles: null, // Needed for local samples.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    bedFile: null, // Optional for WGS samples.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    refSeqAccession: null, // Optional for WGS samples.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    refSeqFile: null, // Needed for WGS samples.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    refSeqTaxon: null, // Needed for WGS samples.
    // Metadata upload information
    clearlabs: false,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    guppyBasecallerSetting: null,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    medakaModel: null,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    metadata: null, //
    metadataIssues: null,
    pipelineVersions: {} as { [projectId: string]: PipelineVersions },
    latestMajorPipelineVersions: {} as PipelineVersions,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    technology: null,
    stepsEnabled: {
      [UploadStepType.SampleStep]: true,
      [UploadStepType.MetadataStep]: false,
      [UploadStepType.ReviewStep]: false,
    },
    hostGenomes: [], // set on metadata upload
    workflows: new Set() as Set<UploadWorkflows>,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    wetlabProtocol: null,
  };

  componentDidMount() {
    // Latest browsers will only show a generic warning
    window.onbeforeunload = () =>
      "Are you sure you want to leave? All data will be lost.";
  }

  onUploadComplete = () => {
    window.onbeforeunload = null;
  };

  handleUploadSamples = ({
    bedFile,
    clearlabs,
    technology,
    project,
    guppyBasecallerSetting,
    medakaModel,
    refSeqAccession,
    refSeqFile,
    refSeqTaxon,
    sampleNamesToFiles,
    samples,
    uploadType,
    wetlabProtocol,
    workflows,
  }: Partial<SampleUploadFlowState>) => {
    this.setState({
      bedFile,
      clearlabs,
      technology,
      currentStep: UploadStepType.MetadataStep,
      guppyBasecallerSetting,
      medakaModel,
      project,
      refSeqAccession,
      refSeqFile,
      refSeqTaxon,
      sampleNamesToFiles,
      samples,
      stepsEnabled: set(
        UploadStepType.MetadataStep,
        true,
        this.state.stepsEnabled,
      ),
      uploadType,
      wetlabProtocol,
      workflows,
    });
  };

  handleUploadMetadata = ({
    metadata,
    issues,
    newHostGenomes,
  }: {
    metadata: SampleUploadFlowState["metadata"];
    issues: SampleUploadFlowState["metadataIssues"];
    newHostGenomes: HostGenome[];
  }) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const updatedHostGenomes = this.props.hostGenomes.concat(newHostGenomes);

    // Populate host_genome_id in sample using metadata.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const newSamples: SampleFromApi[] = this.state.samples.map(
      (sample: $TSFixMe) => {
        const metadataRow = find(
          row =>
            get("sample_name", row) === sample.name ||
            get("Sample Name", row) === sample.name,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          metadata.rows,
        );
        const hostGenomeName = HOST_GENOME_SYNONYMS.reduce(
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          (match: $TSFixMe, name: $TSFixMe) => metadataRow[name] || match,
          null,
        );
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        const hostGenomeId = find(
          // Lowercase to allow for 'human' to match 'Human'. The same logic
          // is replicated in MetadataHelper.
          hg => {
            return hg.name.toLowerCase() === hostGenomeName.toLowerCase();
          },
          updatedHostGenomes,
        ).id;

        // Enforce hipaa compliant host age
        if (hostGenomeName.toLowerCase() === "human") {
          const maxValue = FIELDS_THAT_HAVE_MAX_INPUT["host_age"];
          metadata?.rows?.forEach((row: $TSFixMe) => {
            if ("Host Age" in row) {
              const parsedValue = Number.parseInt(row["Host Age"]);
              const hipaaCompliantVal = min([parsedValue, maxValue + 1]);
              row["Host Age"] = hipaaCompliantVal?.toString();
            }
          });
        }

        return {
          ...sample,
          // Set the host_genome_id and name so it is available in review
          host_genome_id: hostGenomeId,
          host_genome_name: hostGenomeName,
        };
      },
    );

    // Remove host_genome from metadata.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    const newMetadata: SampleUploadFlowState["metadata"] = flow(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      set("rows", metadata.rows.map(omit(HOST_GENOME_SYNONYMS))),
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      set("headers", without(HOST_GENOME_SYNONYMS, metadata.headers)),
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    )(metadata);

    this.setState({
      samples: newSamples,
      metadata: newMetadata,
      metadataIssues: issues,
      currentStep: UploadStepType.ReviewStep,
      stepsEnabled: set(
        UploadStepType.ReviewStep,
        true,
        this.state.stepsEnabled,
      ),
      hostGenomes: updatedHostGenomes,
    });
  };

  samplesChanged = () => {
    this.setState({
      stepsEnabled: {
        [UploadStepType.SampleStep]: true,
        [UploadStepType.MetadataStep]: false,
        [UploadStepType.ReviewStep]: false,
      },
    });
  };

  metadataChanged = () => {
    this.setState({
      stepsEnabled: {
        [UploadStepType.SampleStep]: true,
        [UploadStepType.MetadataStep]: true,
        [UploadStepType.ReviewStep]: false,
      },
    });
  };

  // *** Project-related functions ***
  // Get pipeline versions associated with a project
  getPipelineVersionsForExistingProject = async projectId => {
    if (this.state.pipelineVersions[projectId]) {
      return { pipelineVersions: this.state.pipelineVersions[projectId] };
    }

    const { projectPipelineVersions, latestMajorPipelineVersions } =
      await getProjectPipelineVersions(projectId);
    this.setState((prevState: SampleUploadFlowState) => ({
      pipelineVersions: {
        ...prevState.pipelineVersions,
        [projectId]: projectPipelineVersions,
      },
      latestMajorPipelineVersions,
    }));
  };

  handleStepSelect = (step: UploadStepType) => {
    this.setState({
      currentStep: step,
    });
  };

  // SLIGHT HACK: Keep steps mounted, so user can return to them if needed.
  // The internal state of some steps is difficult to recover if they are unmounted.
  renderSteps = () => {
    const {
      latestMajorPipelineVersions,
      pipelineVersions,
      workflows,
      wetlabProtocol,
    } = this.state;
    return (
      <div>
        <UploadSampleStep
          onDirty={this.samplesChanged}
          onUploadSamples={this.handleUploadSamples}
          visible={this.state.currentStep === UploadStepType.SampleStep}
          basespaceClientId={this.props.basespaceClientId}
          basespaceOauthRedirectUri={this.props.basespaceOauthRedirectUri}
          admin={this.props.admin}
          biohubS3UploadEnabled={this.props.biohubS3UploadEnabled}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          getPipelineVersionsForExistingProject={(projectId: number) =>
            this.getPipelineVersionsForExistingProject(projectId)
          }
          pipelineVersions={pipelineVersions}
          latestMajorPipelineVersions={latestMajorPipelineVersions}
        />
        {this.state.samples && (
          <UploadMetadataStep
            onUploadMetadata={this.handleUploadMetadata}
            samples={this.state.samples}
            // @ts-expect-error Property 'name' is optional in type this.state.project but required in UploadMetadataStep
            project={this.state.project}
            visible={this.state.currentStep === UploadStepType.MetadataStep}
            onDirty={this.metadataChanged}
            workflows={workflows}
          />
        )}
        {this.state.samples && this.state.metadata && (
          <ReviewStep
            bedFile={this.state.bedFile}
            clearlabs={this.state.clearlabs}
            guppyBasecallerSetting={this.state.guppyBasecallerSetting}
            hostGenomes={this.state.hostGenomes}
            medakaModel={this.state.medakaModel}
            metadata={this.state.metadata}
            onStepSelect={this.handleStepSelect}
            onUploadComplete={this.onUploadComplete}
            onUploadStatusChange={this.onUploadStatusChange}
            originalHostGenomes={this.props.hostGenomes}
            pipelineVersions={pipelineVersions}
            project={this.state.project}
            refSeqAccession={this.state.refSeqAccession}
            refSeqFile={this.state.refSeqFile}
            refSeqTaxon={this.state.refSeqTaxon}
            samples={this.state.samples}
            technology={this.state.technology}
            uploadType={this.state.uploadType}
            visible={this.state.currentStep === UploadStepType.ReviewStep}
            wetlabProtocol={wetlabProtocol}
            workflows={workflows}
          />
        )}
      </div>
    );
  };

  onUploadStatusChange = (uploadStatus: boolean) => {
    this.setState({
      stepsEnabled: {
        [UploadStepType.SampleStep]: !uploadStatus,
        [UploadStepType.MetadataStep]: !uploadStatus,
        [UploadStepType.ReviewStep]: !uploadStatus,
      },
    });
  };

  render() {
    return (
      <div>
        <SampleUploadFlowHeader
          currentStep={this.state.currentStep}
          samples={this.state.samples}
          project={this.state.project}
          onStepSelect={this.handleStepSelect}
          stepsEnabled={this.state.stepsEnabled}
        />
        <NarrowContainer className={cx(cs.sampleUploadFlow)}>
          <div className={cs.inner}>{this.renderSteps()}</div>
        </NarrowContainer>
      </div>
    );
  }
}

export default SampleUploadFlow;
