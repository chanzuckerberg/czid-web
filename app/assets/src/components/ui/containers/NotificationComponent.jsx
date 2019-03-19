import React from "react";
import PropTypes from "prop-types";
import AlertIcon from "~ui/icons/AlertIcon";
import cs from "./notification_component.scss";
import cx from "classnames";

class NotificationComponent extends React.Component {
  getIcon(type) {
    switch (type) {
      case "warn":
      case "error":
        return <AlertIcon />;
      default:
        break;
    }
    return null;
  }

  render() {
    return (
      <div
        className={cx(
          this.props.className,
          cs.notification,
          cs[this.props.type]
        )}
      >
        <div className={cs.icon}>{this.getIcon(this.props.type)}</div>
        <div className={cs.content}>
          <div>{this.props.children}</div>
          {this.props.onClose && (
            <div className={cs.actions} onClick={this.props.onClose}>
              Dismiss
            </div>
          )}
        </div>
      </div>
    );
  }
}

NotificationComponent.defaultProps = {
  type: "info"
};

NotificationComponent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func,
  type: PropTypes.oneOf(["success", "info", "warn", "error"])
};

export default NotificationComponent;
