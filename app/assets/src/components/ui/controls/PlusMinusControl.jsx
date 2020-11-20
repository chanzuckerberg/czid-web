import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { IconMinusSmall, IconPlusSmall } from "~/components/ui/icons";
import cs from "./plus_minus_control.scss";

const PlusMinusControl = ({
  onPlusClick,
  onMinusClick,
  plusDisabled,
  minusDisabled,
  className,
}) => {
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

PlusMinusControl.propTypes = {
  className: PropTypes.string,
  onPlusClick: PropTypes.func,
  onMinusClick: PropTypes.func,
  plusDisabled: PropTypes.bool,
  minusDisabled: PropTypes.bool,
};

export default PlusMinusControl;
