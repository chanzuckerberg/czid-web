import cx from "classnames";
import { startCase } from "lodash/fp";
import React from "react";

import { logAnalyticsEvent } from "~/api/analytics";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import PropTypes from "~/components/utils/propTypes";
import Label from "~ui/labels/Label";

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
                  <ExternalLink
                    href="/cli_user_instructions"
                    className={cs.link}
                  >
                    View CLI Instructions.
                  </ExternalLink>
                </div>
              )}
              {currentStep === "uploadMetadata" && (
                <div className={cs.subtitle}>
                  This metadata will provide context around your samples and
                  results in CZ ID.
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
