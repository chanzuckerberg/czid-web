import React from "react";
import PropTypes from "prop-types";
import AlertIcon from "~ui/icons/AlertIcon";
import InfoIcon from "~ui/icons/InfoIcon";
import CheckmarkIcon from "~ui/icons/CheckmarkIcon";
import cs from "./notification.scss";
import cx from "classnames";

class Notification extends React.Component {
  getIcon(type) {
    switch (type) {
      case "warn":
      case "error":
        return <AlertIcon />;
      case "info":
        // TODO (gdingle): test me... add new custom icon
        return <InfoIcon className={cs.successIcon} />;
      case "success":
        return <CheckmarkIcon className={cs.successIcon} />;
      default:
        break;
    }
    return null;
  }

  render() {
    const { children, className, displayStyle, onClose, type } = this.props;
    return (
      <div
        className={cx(className, cs.notification, cs[type], cs[displayStyle])}
      >
        <div className={cs.icon}>{this.getIcon(type)}</div>
        <div className={cs.content}>
          <div>{children}</div>
          {onClose && (
            <div className={cs.actions} onClick={onClose}>
              Dismiss
            </div>
          )}
        </div>
      </div>
    );
  }
}

Notification.defaultProps = {
  displayStyle: "elevated",
};

Notification.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  displayStyle: PropTypes.oneOf(["flat", "elevated"]),
  onClose: PropTypes.func,
  type: PropTypes.oneOf(["success", "info", "warn", "error"]).isRequired,
};

export default Notification;
