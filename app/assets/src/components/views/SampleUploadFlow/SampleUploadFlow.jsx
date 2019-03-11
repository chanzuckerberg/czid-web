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
    metadataIssues: null
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
      currentStep: "uploadMetadata"
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
      currentStep: "review"
    });
  };

  getSamplesForMetadataValidation = () => {
    return this.state.samples.map(sample => ({
      name: sample.name,
      project_id: sample.project_id
    }));
  };

  renderStep = () => {
    switch (this.state.currentStep) {
      case "uploadSamples":
        return <UploadSampleStep onUploadSamples={this.handleUploadSamples} />;
      case "uploadMetadata":
        return (
          <UploadMetadataStep
            onUploadMetadata={this.handleUploadMetadata}
            samples={this.getSamplesForMetadataValidation()}
            project={this.state.project}
          />
        );
      case "review":
        return (
          <ReviewStep
            metadata={this.state.metadata}
            samples={this.state.samples}
            uploadType={this.state.uploadType}
            project={this.state.project}
            sampleNamesToFiles={this.state.sampleNamesToFiles}
            hostGenomes={this.props.host_genomes}
          />
        );
      default:
        return <div />;
    }
  };

  render() {
    return (
      <div>
        <SampleUploadFlowHeader
          currentStep={this.state.currentStep}
          samples={this.state.samples}
          project={this.state.project}
        />
        <NarrowContainer className={cx(cs.sampleUploadFlow)}>
          <div className={cs.inner}>{this.renderStep()}</div>
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
