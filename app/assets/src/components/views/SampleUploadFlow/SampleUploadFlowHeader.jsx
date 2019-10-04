import React from "react";
import { startCase } from "lodash/fp";
import cx from "classnames";

import PropTypes from "~/components/utils/propTypes";
import Label from "~ui/labels/Label";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { logAnalyticsEvent } from "~/api/analytics";

import cs from "./sample_upload_flow.scss";

const MENU_OPTIONS = [
  {
    text: "Samples",
    step: "uploadSamples",
  },
  {
    text: "Metadata",
    step: "uploadMetadata",
  },
  {
    text: "Review",
    step: "review",
  },
];

class SampleUploadFlowHeader extends React.Component {
  isStepEnabled = step => {
    return this.props.stepsEnabled[step];
  };

  onStepSelect = step => {
    if (this.isStepEnabled(step)) {
      this.props.onStepSelect(step);
    }
  };

  render() {
    const { currentStep } = this.props;
    return (
      <div className={cs.headerWrapper}>
        <NarrowContainer>
          <div className={cs.sampleUploadFlowHeader}>
            <div className={cs.titleContainer}>
              <div className={cs.title}>{startCase(currentStep)}</div>
              {currentStep === "uploadSamples" && (
                <div className={cs.subtitle}>
                  Rather use our command-line interface?
                  <a
                    href="https://help.idseq.net/hc/en-us/articles/360034790414-Upload-with-Command-Line"
                    target="_blank"
                    className={cs.link}
                  >
                    View CLI Instructions.
                  </a>
                </div>
              )}
              {currentStep === "uploadMetadata" && (
                <div className={cs.subtitle}>
                  Add custom metadata to leverage in our heatmap and other
                  visualizations.
                </div>
              )}
              {currentStep === "review" && (
                <div className={cs.subtitle}>
                  Uploading {this.props.samples.length} samples to{" "}
                  {this.props.project.name}
                </div>
              )}
            </div>
            <div className={cs.fill} />
            <div className={cs.menu}>
              {MENU_OPTIONS.map((val, index) => (
                <div
                  className={cx(
                    cs.option,
                    currentStep === val.step && cs.active,
                    currentStep !== val.step &&
                      this.isStepEnabled(val.step) &&
                      cs.enabled
                  )}
                  key={val.text}
                  onClick={() => {
                    this.onStepSelect(val.step);
                    logAnalyticsEvent(
                      "SampleUploadFlowHeader_step-option_clicked",
                      {
                        step: val.step,
                        text: val.text,
                      }
                    );
                  }}
                >
                  <Label className={cs.circle} circular text={index + 1} />
                  <div className={cs.text}>{val.text}</div>
                </div>
              ))}
            </div>
          </div>
        </NarrowContainer>
      </div>
    );
  }
}

SampleUploadFlowHeader.propTypes = {
  currentStep: PropTypes.string.isRequired,
  samples: PropTypes.arrayOf(PropTypes.Sample),
  project: PropTypes.Project,
  onStepSelect: PropTypes.func.isRequired,
  stepsEnabled: PropTypes.objectOf(PropTypes.bool),
};

export default SampleUploadFlowHeader;
