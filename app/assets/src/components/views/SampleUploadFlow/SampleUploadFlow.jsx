import React from "react";
import UploadSampleStep from "./UploadSampleStep";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "~/components/utils/propTypes";
import UploadMetadataStep from "./UploadMetadataStep";
import ReviewStep from "./ReviewStep";
import cs from "./sample_upload_flow.scss";

class SampleUploadFlow extends React.Component {
  state = {
    currentStep: "uploadSamples",
    // Sample upload information
    localSampleNamesToFiles: null,
    project: {
      id: 234,
      name: "Mark Test Project"
    },
    hostId: null,
    remoteSamples: null,
    metadata: null,
    metadataIssues: null
  };

  handleUploadSamplesLocal = ({ sampleNamesToFiles, project, hostId }) => {
    this.setState({
      localSampleNamesToFiles: sampleNamesToFiles,
      project,
      hostId,
      currentStep: "uploadMetadata",
      remoteSamples: null
    });
  };

  handleUploadSamplesRemote = ({ samples, project }) => {
    this.setState({
      remoteSamples: samples,
      project,
      localSampleNamesToFiles: null,
      currentStep: "uploadMetadata"
    });
  };

  handleMetadataChange = ({ metadata, issues }) => {
    this.setState({
      metadata,
      metadataIssues: issues
    });
  };

  handleMetadataContinue = () => {
    this.setState({
      currentStep: "review"
    });
  };

  getSamplesForMetadataValidation = () => {
    if (this.state.remoteSamples) {
      return this.state.remoteSamples.map(sample => ({
        name: sample.name,
        host_genome_id: sample.host_genome_id
      }));
    }

    if (this.state.localSampleNamesToFiles) {
      return Object.keys(this.state.localSampleNamesToFiles).map(
        sampleName => ({
          name: sampleName,
          host_genome_id: this.state.hostId
        })
      );
    }

    return {};
  };

  renderStep = () => {
    switch (this.state.currentStep) {
      case "uploadSamples":
        return (
          <UploadSampleStep
            projects={this.props.projects}
            csrf={this.props.csrf}
            host_genomes={this.props.host_genomes}
            admin={this.props.admin}
            onUploadSamplesLocal={this.handleUploadSamplesLocal}
            onUploadSamplesRemote={this.handleUploadSamplesRemote}
          />
        );
      case "uploadMetadata":
        return (
          <UploadMetadataStep
            onMetadataChange={this.handleMetadataChange}
            onContinue={this.handleMetadataContinue}
            project={this.state.project}
            samples={this.getSamplesForMetadataValidation()}
          />
        );
      case "review":
        return (
          <ReviewStep
            metadata={this.state.metadata}
            remoteSamples={this.state.remoteSamples}
            localSampleNamesToFiles={this.state.localSampleNamesToFiles}
            project={this.state.project}
            hostGenomeId={this.state.hostId}
          />
        );
      default:
        return <div />;
    }
  };

  render() {
    return (
      <NarrowContainer className={cs.sampleUploadFlow}>
        <div className={cs.inner}>{this.renderStep()}</div>
      </NarrowContainer>
    );
  }
}

SampleUploadFlow.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.Project),
  csrf: PropTypes.string,
  host_genomes: PropTypes.arrayOf(PropTypes.HostGenome),
  admin: PropTypes.bool
};

export default SampleUploadFlow;
