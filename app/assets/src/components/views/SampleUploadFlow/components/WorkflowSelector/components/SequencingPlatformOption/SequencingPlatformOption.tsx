import cx from "classnames";
import { InputRadio, Tooltip } from "czifui";
import React, { ReactNode } from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import StatusLabel from "~/components/ui/labels/StatusLabel";
import commonStyles from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { PipelineVersionIndicator } from "../PipelineVersionIndicator";
import cs from "./sequencing_platform_option.scss";

interface SequencingPlatformOptionProps {
  analyticsEventName: string;
  customDescription?: string | ReactNode;
  githubLink: string;
  isBeta?: boolean;
  isDisabled?: boolean;
  isSelected: boolean;
  onClick(): void;
  pipelineVersion?: string;
  technologyName: string;
  technologyDetails: ReactNode;
  testId: string;
  tooltipText?: string;
}

const SequencingPlatformOption = ({
  analyticsEventName,
  customDescription,
  githubLink,
  isBeta = false,
  isDisabled = false,
  isSelected,
  onClick,
  pipelineVersion,
  technologyName,
  technologyDetails,
  testId,
  tooltipText,
}: SequencingPlatformOptionProps) => {
  let radioButton = (
    <InputRadio
      disabled={isDisabled}
      stage={isSelected ? "checked" : "unchecked"}
      className={cx(commonStyles.radioButton, commonStyles.alignTitle)}
    />
  );

  if (isDisabled && tooltipText) {
    radioButton = (
      <Tooltip arrow placement="top" title={tooltipText}>
        <span>{radioButton}</span>
      </Tooltip>
    );
  }

  return (
    <div
      className={cx(
        commonStyles.selectableOption,
        cs.technology,
        isSelected && cs.selected,
        isDisabled && commonStyles.disabled,
      )}
      onClick={() => (isDisabled ? null : onClick())}
      data-testid={`sequencing-technology-${testId}`}
    >
      {radioButton}
      <div className={commonStyles.optionText}>
        <div className={commonStyles.title}>
          {technologyName}
          {isBeta && (
            <StatusLabel
              className={isDisabled && cs.disabledStatus}
              inline
              status="Beta"
              type="beta"
            />
          )}
        </div>
        <div
          className={cx(
            cs.technologyDescription,
            isDisabled && commonStyles.disabled,
          )}
        >
          <span>
            {customDescription ??
              `You can check out the ${technologyName} pipeline on Github `}
          </span>
          <ExternalLink
            analyticsEventName={analyticsEventName}
            href={githubLink}
            disabled={isDisabled}
          >
            here
          </ExternalLink>
          .
        </div>
        <div>
          {isSelected && (
            <div className={commonStyles.technologyContent}>
              {technologyDetails}
              <PipelineVersionIndicator version={pipelineVersion} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { SequencingPlatformOption };
