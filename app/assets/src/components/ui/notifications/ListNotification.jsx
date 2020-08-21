// A notification that includes a list of items (such as errors) in an Accordion.

import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import Notification from "~ui/notifications/Notification";
import cs from "./list_notification.scss";
import Accordion from "~/components/layout/Accordion";

class ListNotification extends React.Component {
  render() {
    const {
      type,
      onClose,
      className,
      label,
      listItems,
      listItemName,
    } = this.props;
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

ListNotification.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func,
  type: PropTypes.oneOf(["success", "info", "warning", "error"]),
  label: PropTypes.node,
  listItems: PropTypes.arrayOf(PropTypes.string),
  listItemName: PropTypes.string,
};

export default ListNotification;
