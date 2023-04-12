// A notification that includes a list of items (such as errors) in an Accordion.

import cx from "classnames";
import React from "react";
import Accordion from "~/components/layout/Accordion";
import Notification from "~ui/notifications/Notification";
import cs from "./list_notification.scss";

interface ListNotificationProps {
  className: string;
  onClose: $TSFixMeFunction;
  type: "success" | "info" | "warning" | "error";
  label: React.ReactNode;
  listItems: string[];
  listItemName: string;
}

class ListNotification extends React.Component<ListNotificationProps> {
  render() {
    const { type, onClose, className, label, listItems, listItemName } =
      this.props;
    return (
      <Notification
        type={type}
        onClose={onClose}
        className={cx(className, cs.listNotification, cs[type])}
      >
        <div className={cs.label}>{label}</div>
        <Accordion
          className={cs.accordion}
          header={
            <div className={cs.title}>
              {listItems.length} {listItemName}
              {listItems.length > 1 ? "s" : ""}
            </div>
          }
          iconClassName={cs.accordionIcon}
        >
          <div className={cs.content}>
            {listItems.map((listItem, index) => (
              <div key={index} className={cs.listItem}>
                {listItem}
              </div>
            ))}
          </div>
        </Accordion>
      </Notification>
    );
  }
}

export default ListNotification;
