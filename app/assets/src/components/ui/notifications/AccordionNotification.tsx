import cx from "classnames";
import React from "react";
import Accordion from "~/components/layout/Accordion";
import Notification from "~ui/notifications/Notification";
import cs from "./accordion_notification.scss";

export default class AccordionNotification extends React.Component<AccordionNotificationProps> {
  static defaultProps: AccordionNotificationProps;
  render() {
    const {
      bottomContentPadding,
      className,
      header,
      headerClassName,
      content,
      toggleable,
      type,
      notificationClassName,
      open,
      displayStyle,
      onClose,
    } = this.props;
    const accordion = (
      <Accordion
        bottomContentPadding={bottomContentPadding}
        header={header}
        headerClassName={headerClassName}
        open={open}
        toggleable={toggleable}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        className={cx(cs.listContainer, cs[type])}
        toggleArrowAlignment="topRight"
      >
        {content && <div className={cs.messageContainer}>{content}</div>}
      </Accordion>
    );

    return (
      <div className={cx(cs.AccordionNotification, className)}>
        <Notification
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          type={type}
          displayStyle={displayStyle}
          className={cx(cs.notificationContainer, notificationClassName)}
          onClose={onClose}
        >
          {accordion}
        </Notification>
      </div>
    );
  }
}

AccordionNotification.defaultProps = {
  bottomContentPadding: true,
  type: "info",
  displayStyle: "flat",
};

interface AccordionNotificationProps {
  bottomContentPadding?: boolean;
  className?: string;
  header?: React.ReactNode;
  headerClassName?: string;
  content?: React.ReactNode;
  notificationClassName?: string;
  open?: boolean;
  toggleable?: boolean;
  type?: "success" | "info" | "warning" | "error";
  displayStyle?: "flat" | "elevated";
  onClose?: $TSFixMeFunction;
}
