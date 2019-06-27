import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import PlusControlIcon from "~/components/ui/icons/PlusControlIcon.jsx";
import MinusControlIcon from "~/components/ui/icons/MinusControlIcon.jsx";
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
        <PlusControlIcon className={cs.icon} />
      </button>
      <button disabled={minusDisabled} onClick={onMinusClick}>
        <MinusControlIcon className={cs.icon} />
      </button>
    </div>
  );
};

PlusMinusControl.propTypes = {
  onPlusClick: PropTypes.func,
  onMinusClick: PropTypes.func,
  plusDisabled: PropTypes.bool,
  minusDisabled: PropTypes.bool,
};

export default PlusMinusControl;
