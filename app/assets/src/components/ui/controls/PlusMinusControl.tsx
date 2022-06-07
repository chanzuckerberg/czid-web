import cx from "classnames";
import React from "react";

import { IconMinusSmall, IconPlusSmall } from "~/components/ui/icons";
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
      <button disabled={plusDisabled} onClick={onPlusClick}>
        <IconPlusSmall className={cs.icon} />
      </button>
      <button disabled={minusDisabled} onClick={onMinusClick}>
        <IconMinusSmall className={cs.icon} />
      </button>
    </div>
  );
};

export default PlusMinusControl;
