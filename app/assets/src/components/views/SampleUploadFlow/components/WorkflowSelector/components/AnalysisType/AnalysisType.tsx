// TODO (mlila): generally, check permutations of feature flags
import cx from "classnames";
import {
  Icon,
  IconNameToSizes,
  InputCheckbox,
  InputRadio,
  Tooltip,
} from "czifui";
import { kebabCase } from "lodash/fp";
import React, { ReactNode, useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import StatusLabel from "~/components/ui/labels/StatusLabel";
import { AMR_V1_FEATURE } from "~/components/utils/features";
import commonStyles from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import cs from "./analysis_type.scss";

interface AnalysisTypeProps {
  description: string;
  customIcon?: ReactNode;
  isBeta?: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  onClick(): void;
  sequencingPlatformOptions?: ReactNode | null;
  sdsIcon?: keyof IconNameToSizes;
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
  title,
}: AnalysisTypeProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const radioOption = allowedFeatures.includes(AMR_V1_FEATURE) ? (
    <InputCheckbox
      disabled={isDisabled}
      className={commonStyles.checkbox}
      stage={isSelected ? "checked" : "unchecked"}
    />
  ) : (
    <InputRadio
      stage={isSelected ? "checked" : "unchecked"}
      className={commonStyles.radioButton}
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
      data-testid={`analysis-type-${kebabCase(title)}`}
    >
      <Tooltip
        classes={{ arrow: cs.tooltipArrow }}
        arrow
        placement="top-start"
        title={tooltipText}
        disableHoverListener={
          !allowedFeatures.includes(AMR_V1_FEATURE) || !isDisabled
        }
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
