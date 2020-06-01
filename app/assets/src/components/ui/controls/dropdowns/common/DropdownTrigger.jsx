import React from "react";
import cx from "classnames";
import { get } from "lodash/fp";

import PropTypes from "prop-types";
import cs from "./dropdown_trigger.scss";

// Set of component names that render labels that contain badge counts
const DROPDOWN_LABEL_OWNERS_WITH_BADGE_COUNTS = new Set([
  "ThresholdFilterDropdown",
  "MultipleNestedDropdown",
]);

class DropdownTrigger extends React.Component {
  constructor(props) {
    super(props);

    this.resizeObserver;
    this.labelContainerRef;
    this.labelRef;

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
    this.resizeObserver?.disconnect();
  }

  handleFilterResize = labelContainers => {
    const labelContainerWidth = labelContainers[0].contentRect.width - 3.7; // -3.7 removes padding
    const labelTextWidth = this.labelRef.current.offsetWidth + 1;
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
    } = this.props;

    const hasDropdownLabel = get("type.name", value) === "DropdownLabel";
    const labelOwner = hasDropdownLabel ? get("_owner.type.name", value) : null;
    const dropdownLabelHasBadgeCount = DROPDOWN_LABEL_OWNERS_WITH_BADGE_COUNTS.has(
      labelOwner
    );

    if (dropdownLabelHasBadgeCount) {
      this.labelContainerRef = React.createRef();
      this.labelRef = React.createRef();
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
          className={cx(cs.labelContainer)}
          ref={dropdownLabelHasBadgeCount && this.labelContainerRef}
        >
          {label && (
            <span
              className={cx(cs.label)}
              ref={dropdownLabelHasBadgeCount && this.labelRef}
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
