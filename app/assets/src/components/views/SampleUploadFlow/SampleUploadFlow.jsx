import React from "react";
import cx from "classnames";
import { get, without, flow, omit, set, find } from "lodash/fp";
import UploadSampleStep from "./UploadSampleStep";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "~/components/utils/propTypes";
import UploadMetadataStep from "./UploadMetadataStep";
import ReviewStep from "./ReviewStep";
import cs from "./sample_upload_flow.scss";
import SampleUploadFlowHeader from "./SampleUploadFlowHeader";

class SampleUploadFlow extends React.Component {
  state = {
    currentStep: "uploadSamples",
    // Sample upload information
    samples: null,
    uploadType: "", // remote or local
    project: null,
    sampleNamesToFiles: null, // Needed for local samples.
    // Metadata upload information
    metadata: null, //
    metadataIssues: null,
    // Once the upload has started, the user cannot return to past steps.
    isUploading: false,
    stepsEnabled: {
      uploadSamples: true,
      uploadMetadata: false,
      review: false
    }
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
    samples,
    project,
    uploadType,
    sampleNamesToFiles
  }) => {
    this.setState({
      samples,
      project,
      uploadType,
      sampleNamesToFiles,
      currentStep: "uploadMetadata",
      stepsEnabled: set("uploadMetadata", true, this.state.stepsEnabled)
    });
  };

  handleUploadMetadata = ({ metadata, issues }) => {
    // Populate host_genome_id in sample using metadata.
    const newSamples = this.state.samples.map(sample => {
      const metadataRow = find(
        row =>
          get("sample_name", row) === sample.name ||
          get("Sample Name", row) === sample.name,
        metadata.rows
      );

      const hostGenomeId = find(
        [
          "name",
          get("host_genome", metadataRow) || get("Host Genome", metadataRow)
        ],
        this.props.host_genomes
      ).id;

      return {
        ...sample,
        host_genome_id: hostGenomeId
      };
    });

    // Remove host_genome from metadata.
    const newMetadata = flow(
      set("rows", metadata.rows.map(omit(["host_genome", "Host Genome"]))),
      set("headers", without(["host_genome", "Host Genome"], metadata.headers))
    )(metadata);

    this.setState({
      samples: newSamples,
      metadata: newMetadata,
      metadataIssues: issues,
      currentStep: "review",
      stepsEnabled: set("review", true, this.state.stepsEnabled)
    });
  };

  samplesChanged = () => {
    this.setState({
      stepsEnabled: {
        uploadSamples: true,
        uploadMetadata: false,
        review: false
      }
    });
  };

  metadataChanged = () => {
    this.setState({
      stepsEnabled: {
        uploadSamples: true,
        uploadMetadata: true,
        review: false
      }
    });
  };

  handleStepSelect = step => {
    this.setState({
      currentStep: step
    });
  };

  getSamplesForMetadataValidation = () => {
    return this.state.samples.map(sample => ({
      name: sample.name,
      project_id: sample.project_id
    }));
  };

  // SLIGHT HACK: Keep steps mounted, so user can return to them if needed.
  // The internal state of some steps is difficult to recover if they are unmounted.
  renderSteps = () => {
    return (
      <div>
        <UploadSampleStep
          onDirty={this.samplesChanged}
          onUploadSamples={this.handleUploadSamples}
          visible={this.state.currentStep === "uploadSamples"}
        />
        {this.state.samples && (
          <UploadMetadataStep
            onUploadMetadata={this.handleUploadMetadata}
            samples={this.getSamplesForMetadataValidation()}
            project={this.state.project}
            visible={this.state.currentStep === "uploadMetadata"}
            onDirty={this.metadataChanged}
          />
        )}
        {this.state.samples &&
          this.state.metadata && (
            <ReviewStep
              metadata={this.state.metadata}
              samples={this.state.samples}
              uploadType={this.state.uploadType}
              project={this.state.project}
              sampleNamesToFiles={this.state.sampleNamesToFiles}
              hostGenomes={this.props.host_genomes}
              visible={this.state.currentStep === "review"}
              onUploadStatusChange={this.onUploadStatusChange}
              onStepSelect={this.handleStepSelect}
              onUploadComplete={this.onUploadComplete}
            />
          )}
      </div>
    );
  };

  onUploadStatusChange = uploadStatus => {
    this.setState({
      isUploading: uploadStatus
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
          isUploading={this.state.isUploading}
          stepsEnabled={this.state.stepsEnabled}
        />
        <NarrowContainer className={cx(cs.sampleUploadFlow)}>
          <div className={cs.inner}>{this.renderSteps()}</div>
        </NarrowContainer>
      </div>
    );
  }
}

SampleUploadFlow.propTypes = {
  csrf: PropTypes.string,
  host_genomes: PropTypes.arrayOf(PropTypes.HostGenome),
  admin: PropTypes.bool
};

export default SampleUploadFlow;
