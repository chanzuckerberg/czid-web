import { ButtonIcon } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import cs from "./plus_minus_control.scss";

interface PlusMinusControlProps {
  className?: string;
  onPlusClick?: $TSFixMeFunction;
  onMinusClick?: $TSFixMeFunction;
  plusDisabled?: boolean;
  minusDisabled?: boolean;
}

const PlusMinusControl = ({
  onPlusClick,
  onMinusClick,
  plusDisabled,
  minusDisabled,
  className,
}: PlusMinusControlProps) => {
  return (
    <div className={cx(className, cs.plusMinusContainer)}>
      <ButtonIcon
        className={cs.button}
        sdsIcon="plus"
        sdsSize="small"
        sdsType="tertiary"
        disabled={plusDisabled}
        onClick={onPlusClick}
      />
      <ButtonIcon
        className={cs.button}
        sdsIcon="minus"
        sdsSize="small"
        sdsType="tertiary"
        disabled={minusDisabled}
        onClick={onMinusClick}
      />
    </div>
  );
};

export default PlusMinusControl;
