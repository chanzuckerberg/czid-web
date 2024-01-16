import cx from "classnames";
import { find } from "lodash/fp";
import React from "react";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { GlobalContext } from "~/globalContext/reducer";
import { Project, SampleFromApi } from "~/interface/shared";
import { UploadStepType } from "~/interface/upload";
import Label from "~ui/labels/Label";
import cs from "../../sample_upload_flow.scss";

const MENU_OPTIONS = [
  {
    text: "Samples",
    step: UploadStepType.SampleStep,
    title: "Select Samples",
  },
  {
    text: "Metadata",
    step: UploadStepType.MetadataStep,
    title: "Upload Metadata",
  },
  {
    text: "Review",
    step: UploadStepType.ReviewStep,
    title: "Review",
  },
];

interface SampleUploadFlowHeaderProps {
  currentStep: UploadStepType;
  samples: SampleFromApi[] | null;
  project?: Project;
  onStepSelect(UploadStepType): void;
  stepsEnabled?: Record<UploadStepType, boolean>;
}

export class SampleUploadFlowHeader extends React.Component<SampleUploadFlowHeaderProps> {
  static contextType = GlobalContext;
  isStepEnabled = (step: UploadStepType) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return this.props.stepsEnabled[step];
  };

  onStepSelect = (step: UploadStepType) => {
    if (this.isStepEnabled(step)) {
      this.props.onStepSelect(step);
    }
  };

  render() {
    const { currentStep } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
    const { title } = find(opt => currentStep === opt.step, MENU_OPTIONS);

    return (
      <div className={cs.headerWrapper}>
        <NarrowContainer>
          <div className={cs.sampleUploadFlowHeader}>
            <div className={cs.titleContainer}>
              <div className={cs.title}>{title}</div>
              {currentStep === UploadStepType.SampleStep && (
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
              {currentStep === UploadStepType.MetadataStep && (
                <div className={cs.subtitle}>
                  This metadata will provide context around your samples and
                  results in CZ ID.
                </div>
              )}
              {currentStep === UploadStepType.ReviewStep && (
                <div className={cs.subtitle}>
                  {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
                  Uploading {this.props.samples.length} samples to{" "}
                  {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
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
                      cs.enabled,
                  )}
                  key={val.text}
                  onClick={() => {
                    this.onStepSelect(val.step);
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
