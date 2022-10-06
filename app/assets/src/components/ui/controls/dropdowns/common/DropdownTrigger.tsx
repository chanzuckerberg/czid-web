import cx from "classnames";

import { isNil } from "lodash/fp";
import React from "react";
import cs from "./dropdown_trigger.scss";

interface DropdownTriggerProps {
  className?: string;
  label?: string;
  itemSubtext?: string;
  value?: React.ReactNode;
  placeholder?: string;
  rounded?: boolean;
  active?: boolean;
  disabled?: boolean;
  erred?: boolean;
  onClick?: $TSFixMeFunction;
  disableMarginRight?: boolean;
}

interface DropdownTriggerState {
  hideDropdownLabel: boolean;
}

class DropdownTrigger extends React.Component<
  DropdownTriggerProps,
  DropdownTriggerState
> {
  resizeObserver: $TSFixMe;
  constructor(props: DropdownTriggerProps) {
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
          erred && cs.erred,
        )}
        onClick={onClick}
      >
        <div className={cs.labelContainer}>
          {label && (
            <span
              className={cx(
                cs.label,
                disableMarginRight && cs.disableMarginRight,
              )}
            >
              {label}
            </span>
          )}
          <span
            className={cx(
              this.state.hideDropdownLabel && cs.hide,
              isNil(value) && cs.placeholder,
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

export default DropdownTrigger;
