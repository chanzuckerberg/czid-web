import React from "react";
import cx from "classnames";

import PropTypes from "prop-types";
import cs from "./dropdown_trigger.scss";

class DropdownTrigger extends React.Component {
  constructor(props) {
    super(props);

    this.resizeObserver = null;

    this.state = {
      hideDropdownLabel: false,
    };
  }

  render() {
    const {
      label,
      itemSubtext,
      value,
      rounded,
      active,
      disabled,
      erred,
      className,
      onClick,
      placeholder,
    } = this.props;

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
        <div className={cs.labelContainer}>
          {label && (
            <span className={cx(cs.label, cs.disableMarginRight)}>{label}</span>
          )}
          <span
            className={cx(
              this.state.hideDropdownLabel && cs.hide,
              value === null && cs.placeholder
            )}
          >
            {value || placeholder}
          </span>
          {itemSubtext && <span className={cs.itemSubtext}>{itemSubtext}</span>}
        </div>
      </div>
    );
  }
}

DropdownTrigger.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  itemSubtext: PropTypes.string,
  value: PropTypes.node,
  placeholder: PropTypes.string,
  rounded: PropTypes.bool,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  erred: PropTypes.bool,
  onClick: PropTypes.func,
};

export default DropdownTrigger;
