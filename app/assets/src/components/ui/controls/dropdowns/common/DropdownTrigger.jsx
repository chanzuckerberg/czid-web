import React from "react";
import cx from "classnames";
import { get } from "lodash/fp";

import PropTypes from "prop-types";
import cs from "./dropdown_trigger.scss";

class DropdownTrigger extends React.Component {
  constructor(props) {
    super(props);

    this.resizeObserver = null;
    this.labelContainerRef = null;
    this.labelRef = null;

    this.state = {
      hideDropdownLabel: false,
    };
  }

  componentDidMount() {
    if (this.labelContainerRef) {
      this.resizeObserver = new ResizeObserver(this.handleFilterResize);
      this.resizeObserver.observe(this.labelContainerRef.current);
    }
  }

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  handleFilterResize = labelContainers => {
    const labelContainerWidth = labelContainers[0].contentRect.width - 3.7; // -3.7 removes padding from container
    const labelTextWidth = this.labelRef.current.offsetWidth;
    const badgeCountWidth = 24;

    // If there's not enough space for the labelText + badgeCount hide, else show;
    labelContainerWidth <= labelTextWidth + badgeCountWidth
      ? this.setState({ hideDropdownLabel: true })
      : this.setState({ hideDropdownLabel: false });
  };

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
      hideBadgeIfInsufficientSpace,
    } = this.props;

    if (hideBadgeIfInsufficientSpace) {
      const hasDropdownLabel = get("type.name", value) === "DropdownLabel";
      if (hasDropdownLabel) {
        this.labelContainerRef = React.createRef();
        this.labelRef = React.createRef();
      }
    }

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
        <div
          className={cs.labelContainer}
          ref={hideBadgeIfInsufficientSpace && this.labelContainerRef}
        >
          {label && (
            <span
              className={cx(
                cs.label,
                hideBadgeIfInsufficientSpace && cs.disableMarginRight
              )}
              ref={hideBadgeIfInsufficientSpace && this.labelRef}
            >
              {label}
            </span>
          )}
          <span
            className={cx(
              this.state.hideDropdownLabel && cs.hide,
              value === null && cs.placeholder
            )}
          >
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
