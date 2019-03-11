import React from "react";
import PropTypes from "~/components/utils/propTypes";
import cs from "./sample_upload_flow.scss";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { startCase } from "lodash/fp";

class SampleUploadFlowHeader extends React.Component {
  render() {
    const { currentStep } = this.props;
    return (
      <NarrowContainer>
        <div className={cs.sampleUploadFlowHeader}>
          <div className={cs.title}>{startCase(currentStep)}</div>
          {currentStep === "uploadSamples" && (
            <div className={cs.subtitle}>
              Rather use our command-line interface?
              <a
                href="/cli_user_instructions"
                target="_blank"
                className={cs.link}
              >
                Instructions here.
              </a>
            </div>
          )}
          {currentStep === "uploadMetadata" && (
            <div className={cs.subtitle}>
              Add custom metadata to leverage in our heatmap and other visualizations.
            </div>
          )}
          {currentStep === "review" && (
            <div className={cs.subtitle}>
              Uploading {this.props.samples.length} samples to {this.props.project.name}
            </div>
          )}
          <div className={cs.border} />
        </div>
      </NarrowContainer>
    );
  }
}

SampleUploadFlowHeader.propTypes = {
  currentStep: PropTypes.string.isRequired,
  samples: PropTypes.arrayOf(PropTypes.Sample),
  project: PropTypes.Project,
};

export default SampleUploadFlowHeader;
