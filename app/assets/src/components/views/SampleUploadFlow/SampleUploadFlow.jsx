import React from "react";
import cx from "classnames";
import { get, without, flow, omit, set, find } from "lodash/fp";
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
    samples: null,
    uploadType: "", // remote or local
    project: null,
    // Metadata upload information
    metadata: null, //
    metadataIssues: null
  };

  handleUploadSamples = ({ samples, project, uploadType }) => {
    this.setState({
      samples,
      project,
      uploadType,
      currentStep: "uploadMetadata"
    });
  };

  handleUploadMetadata = ({ metadata, issues }) => {
    // Populate host_genome_id in sample using metadata.
    const newSamples = this.state.samples.map(sample => {
      const metadataRow = find(["sample_name", sample.name], metadata.rows);
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
          />
        );
      default:
        return <div />;
    }
  };

  render() {
    return (
      <NarrowContainer
        className={cx(
          cs.sampleUploadFlow,
          this.state.currentStep === "uploadSamples" && cs.narrow
        )}
      >
        <div className={cs.inner}>{this.renderStep()}</div>
      </NarrowContainer>
    );
  }
}

SampleUploadFlow.propTypes = {
  csrf: PropTypes.string,
  host_genomes: PropTypes.arrayOf(PropTypes.HostGenome),
  admin: PropTypes.bool
};

export default SampleUploadFlow;
