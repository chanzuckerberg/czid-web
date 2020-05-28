import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import cs from "./dropdown_trigger.scss";

class DropdownTrigger extends React.Component {
  render() {
    const {
      label,
      value,
      rounded,
      active,
      disabled,
      erred,
      className,
      onClick,
      placeholder,
    } = this.props;

    const hasBadgeCount =
      label === "Threshold Filters:" || label === "Categories:";
    return (
      <div
        className={cx(
          className,
          cs.dropdownTrigger,
          rounded && cs.rounded,
          active && cs.active,
          disabled && cs.disabled,
          erred && cs.erred
        )}
        onClick={onClick}
      >
        <div className={cx(cs.labelContainer, hasBadgeCount && cs.badgeCount)}>
          {label && <span className={cs.label}>{label}</span>}
          <span className={cx(value === null && cs.placeholder)}>
            {value || placeholder}
          </span>
        </div>
      </div>
    );
  }
}

DropdownTrigger.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.node,
  placeholder: PropTypes.string,
  rounded: PropTypes.bool,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  erred: PropTypes.bool,
  onClick: PropTypes.func,
};

export default DropdownTrigger;
