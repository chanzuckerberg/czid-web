import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import cs from "./dropdown_trigger.scss";

class DropdownTrigger extends React.Component {
  render() {
    const { label, value, rounded, active, disabled, className } = this.props;
    return (
      <div
        className={cx(
          className,
          cs.dropdownTrigger,
          rounded && cs.rounded,
          active && cs.active,
          disabled && cs.disabled
        )}
      >
        <div className={cs.labelContainer}>
          <span className={cs.label}>{label}</span>
          {value}
        </div>
      </div>
    );
  }
}

DropdownTrigger.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.node,
  rounded: PropTypes.bool,
  active: PropTypes.bool,
  disabled: PropTypes.bool
};

export default DropdownTrigger;
