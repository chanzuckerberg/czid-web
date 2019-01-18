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
    }
    return null;
  }

  render() {
    return (
      <div className={cx(cs.notification, cs[this.props.type])}>
        <div className={cs.icon}>{this.getIcon(this.props.type)}</div>
        <div className={cs.content}>
          <div>{this.props.children}</div>
          <div className={cs.actions} onClick={this.props.handleCloseToast}>
            Dismiss
          </div>
        </div>
      </div>
    );
  }
}

NotificationComponent.defaultProps = {
  type: "info"
};

NotificationComponent.propTypes = {
  children: PropTypes.node,
  handleCloseToast: PropTypes.func,
  type: PropTypes.oneOf(["success", "info", "warn", "error"])
};

export default NotificationComponent;
