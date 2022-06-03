import cx from "classnames";
import React from "react";
import { IconCheckSmall, IconAlert, IconInfo, IconCloseSmall } from "~ui/icons";
import cs from "./notification.scss";

interface NotificationProps {
  className: string;
  children: React.ReactNode;
  displayStyle: "flat" | "elevated";
  onClose: $TSFixMeFunction;
  type: "success" | "info" | "warning" | "error";
  closeWithDismiss: boolean;
  closeWithIcon: boolean;
}

class Notification extends React.Component<NotificationProps> {
  static defaultProps: NotificationProps;
  getIcon(type) {
    switch (type) {
      case "warning":
      case "error":
        return <IconAlert type={type} />;
      case "info":
        return <IconInfo />;
      case "success":
        return <IconCheckSmall className={cs.successIcon} />;
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
      closeWithIcon,
    } = this.props;
    return (
      <div
        className={cx(className, cs.notification, cs[type], cs[displayStyle])}
      >
        <div className={cs.icon}>{this.getIcon(type)}</div>
        <div className={cs.content}>
          <>{children}</>
          {onClose && closeWithDismiss && (
            <div className={cs.actions} onClick={onClose}>
              Dismiss
            </div>
          )}
        </div>
        {onClose && closeWithIcon && (
          <IconCloseSmall className={cs.removeIcon} onClick={onClose} />
        )}
      </div>
    );
  }
}

Notification.defaultProps = {
  displayStyle: "elevated",
  closeWithDismiss: true,
  closeWithIcon: false,
};
export default Notification;
