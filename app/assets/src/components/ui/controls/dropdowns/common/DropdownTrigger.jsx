import cx from "classnames";

import { isNil } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
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
      active,
      className,
      disabled,
      erred,
      disableMarginRight,
      itemSubtext,
      label,
      onClick,
      placeholder,
      rounded,
      value,
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
            <span
              className={cx(
                cs.label,
                disableMarginRight && cs.disableMarginRight
              )}
            >
              {label}
            </span>
          )}
          <span
            className={cx(
              this.state.hideDropdownLabel && cs.hide,
              isNil(value) && cs.placeholder
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
  disableMarginRight: PropTypes.bool,
};

export default DropdownTrigger;
