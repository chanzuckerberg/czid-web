// ToolbarIcons are used at the top of the Samples View table.

import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

import BasicPopup from "~/components/BasicPopup";

import cs from "./toolbar_icon.scss";

class ToolbarIcon extends React.Component {
  render() {
    const {
      className,
      popupText,
      popupSubtitle,
      disabled,
      onClick,
      icon,
    } = this.props;

    const iconWrapper = (
      <div
        className={cx(className, cs.iconWrapper, disabled && cs.disabled)}
        onClick={onClick}
      >
        {icon}
      </div>
    );

    if (!popupText) {
      return iconWrapper;
    }

    return (
      <BasicPopup
        trigger={iconWrapper}
        content={
          <div className={cs.popupText}>
            {popupText}
            <div className={cs.popupSubtitle}>{popupSubtitle}</div>
          </div>
        }
        position="top center"
        basic={false}
      />
    );
  }
}

ToolbarIcon.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.node,
  popupText: PropTypes.string,
  popupSubtitle: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

export default ToolbarIcon;
