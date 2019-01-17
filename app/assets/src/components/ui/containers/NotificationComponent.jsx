import React from "react";
import PropTypes from "prop-types";
import AlertIcon from "~ui/icons/AlertIcon";
import cs from "./notification_component.scss";
import cx from "classnames";

class NotificationComponent extends React.Component {
  icons = {
    error: <AlertIcon />,
    warn: <AlertIcon />
  };

  render() {
    return (
      <div className={cx(cs.notification, cs[this.props.type])}>
        <div className={cs.leftPane}>
          {NotificationComponent.icons[this.props.type]}
        </div>
        <div className={cs.content}>This is a sample notification</div>
        <div className={cs.rightPane} onClick={this.props.handleCloseToast}>
          Dismiss
        </div>
      </div>
    );
  }
}

NotificationComponent.propTypes = {
  handleCloseToast: PropTypes.func,
  type: PropTypes.oneof(["success", "info", "warn", "error"])
};

export default NotificationComponent;
