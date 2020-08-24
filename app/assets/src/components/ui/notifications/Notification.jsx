import React from "react";
import PropTypes from "prop-types";
import { CheckmarkIcon, IconAlert, InfoIcon, RemoveIcon } from "~ui/icons";
import cs from "./notification.scss";
import cx from "classnames";

class Notification extends React.Component {
  getIcon(type) {
    switch (type) {
      case "warning":
      case "error":
        return <IconAlert type={type} />;
      case "info":
        return <InfoIcon />;
      case "success":
        return <CheckmarkIcon className={cs.successIcon} />;
      default:
        break;
    }
    return null;
  }

  render() {
    const {
      children,
      className,
      displayStyle,
      onClose,
      type,
      closeWithDismiss,
    } = this.props;
    return (
      <div
        className={cx(className, cs.notification, cs[type], cs[displayStyle])}
      >
        <div className={cs.icon}>{this.getIcon(type)}</div>
        <div className={cs.content}>
          <div>{children}</div>
          {onClose && closeWithDismiss && (
            <div className={cs.actions} onClick={onClose}>
              Dismiss
            </div>
          )}
        </div>
        {onClose && !closeWithDismiss && (
          <RemoveIcon className={cs.removeIcon} onClick={onClose} />
        )}
      </div>
    );
  }
}

Notification.defaultProps = {
  displayStyle: "elevated",
  closeWithDismiss: true,
};

Notification.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  displayStyle: PropTypes.oneOf(["flat", "elevated"]),
  onClose: PropTypes.func,
  type: PropTypes.oneOf(["success", "info", "warning", "error"]).isRequired,
  closeWithDismiss: PropTypes.bool,
};

export default Notification;
