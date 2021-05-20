import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import Accordion from "~/components/layout/Accordion";
import Notification from "~ui/notifications/Notification";

import cs from "./accordion_notification.scss";

export default class AccordionNotification extends React.Component {
  render() {
    const {
      className,
      header,
      content,
      toggleable,
      type,
      open,
      displayStyle,
      onClose,
    } = this.props;
    const accordion = (
      <Accordion
        bottomContentPadding
        header={header}
        open={open}
        toggleable={toggleable}
        className={cx(cs.listContainer, cs[type])}
        toggleArrowAlignment="topRight"
      >
        {content && <div className={cs.messageContainer}>{content}</div>}
      </Accordion>
    );

    return (
      <div className={cx(cs.AccordionNotification, className)}>
        <Notification
          type={type}
          displayStyle={displayStyle}
          className={cs.notificationContainer}
          onClose={onClose}
        >
          {accordion}
        </Notification>
      </div>
    );
  }
}

AccordionNotification.defaultProps = {
  type: "info",
  displayStyle: "flat",
};

AccordionNotification.propTypes = {
  className: PropTypes.string,
  header: PropTypes.node,
  content: PropTypes.node,
  open: PropTypes.bool,
  toggleable: PropTypes.bool,
  type: PropTypes.oneOf(["success", "info", "warning", "error"]),
  displayStyle: PropTypes.oneOf(["flat", "elevated"]),
  onClose: PropTypes.func,
};
