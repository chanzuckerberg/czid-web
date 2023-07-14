import {
  Icon,
  IconNameToSizes,
  InputCheckbox,
  Tooltip,
} from "@czi-sds/components";
import cx from "classnames";
import React, { ReactNode } from "react";
import StatusLabel from "~/components/ui/labels/StatusLabel";
import commonStyles from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { UploadWorkflows } from "~/components/views/SampleUploadFlow/constants";
import cs from "./analysis_type.scss";

interface AnalysisTypeProps {
  description: ReactNode;
  customIcon?: ReactNode;
  isBeta?: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  onClick(): void;
  sequencingPlatformOptions?: ReactNode | null;
  sdsIcon?: keyof IconNameToSizes;
  testKey: UploadWorkflows;
  title: string;
}

const AnalysisType = ({
  description,
  customIcon,
  isBeta = false,
  isDisabled,
  isSelected,
  onClick,
  sequencingPlatformOptions = null,
  sdsIcon,
  testKey,
  title,
}: AnalysisTypeProps) => {
  const radioOption = (
    <InputCheckbox
      disabled={isDisabled}
      className={commonStyles.checkbox}
      stage={isSelected ? "checked" : "unchecked"}
    />
  );

  const tooltipText =
    "This is disabled because this pipeline cannot be run with the current selection.";

  return (
    <div
      // re:role, typically, we would want an actual button, but this is a container that holds
      // buttons, and you can't have a button be a descendant of a button
      role="checkbox"
      aria-checked={isSelected}
      className={cx(
        commonStyles.selectableOption,
        isSelected && commonStyles.selected,
        isDisabled && commonStyles.disabled,
      )}
      onClick={() => (isDisabled ? null : onClick())}
      key={title}
      data-testid={`analysis-type-${testKey}`}
    >
      <Tooltip
        classes={{ arrow: cs.tooltipArrow }}
        arrow
        placement="top-start"
        title={tooltipText}
        disableHoverListener={!isDisabled}
      >
        <span>{radioOption}</span>
      </Tooltip>
      <div className={cs.iconSample}>
        {/* use a custom icon if one is given, otherwise generate an SDS icon */}
        {customIcon ?? (
          <Icon
            sdsIcon={sdsIcon}
            sdsSize="xl"
            sdsType="static"
            className={isDisabled && cs.disabledIcon}
          />
        )}
      </div>
      <div className={commonStyles.optionText}>
        <div className={cx(commonStyles.title, isBeta && cs.alignBetaIcon)}>
          <span>{title}</span>
          {isBeta && (
            <span className={cs.statusLabel}>
              <StatusLabel
                className={isDisabled && cs.disabledStatus}
                inline
                status="Beta"
                type={isDisabled ? "default" : "beta"}
              />
            </span>
          )}
        </div>
        <div className={cs.description}>{description}</div>
        {isSelected && sequencingPlatformOptions}
      </div>
    </div>
  );
};

export { AnalysisType };
