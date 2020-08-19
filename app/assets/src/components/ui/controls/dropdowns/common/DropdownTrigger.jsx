import React from "react";
import cx from "classnames";
import { get } from "lodash/fp";

import PropTypes from "prop-types";
import cs from "./dropdown_trigger.scss";

class DropdownTrigger extends React.Component {
  constructor(props) {
    super(props);

    this.resizeObserver = null;
    this.labelContainerRef = React.createRef();
    this.labelRef = React.createRef();

    this.state = {
      hideDropdownLabel: false,
    };
  }

  componentDidMount() {
    if (this.labelContainerRef.current && this.labelRef.current) {
      this.resizeObserver = new ResizeObserver(this.handleFilterResize);
      this.resizeObserver.observe(this.labelContainerRef.current);
    }
  }

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  handleFilterResize = () => {
    const { value } = this.props;

    const hasDropdownLabel = get("type.name", value) === "DropdownLabel";
    if (hasDropdownLabel) {
      const labelContainerWidth = this.labelContainerRef.current.offsetWidth;
      const labelTextWidth = this.labelRef.current.offsetWidth;
      const badgeCountWidth = 24; // badge count width set by semantic-ui

      // If there's not enough space for the labelText + badgeCount hide, else show;
      const hideDropdownLabel =
        labelContainerWidth <= labelTextWidth + badgeCountWidth;
      this.setState({ hideDropdownLabel });
    }
  };

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
      hideBadgeIfInsufficientSpace,
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

  /*
  This prop should only be used when a DropdownLabel (a.k.a. the "badge") is passed in as the value.
  This prop is needed because we handle filter layout differently on different pages.
  On the sample report page, we want the filters to expand instead of hiding the badge.
  On the heatmap, the filter width is fixed, so we want to hide the badge if the page width gets too narrow.
  */
  hideBadgeIfInsufficientSpace: PropTypes.bool,
};

export default DropdownTrigger;
