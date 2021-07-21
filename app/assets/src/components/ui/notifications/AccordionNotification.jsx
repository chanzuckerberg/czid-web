import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import Accordion from "~/components/layout/Accordion";
import Notification from "~ui/notifications/Notification";

import cs from "./accordion_notification.scss";

export default class AccordionNotification extends React.Component {
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

AccordionNotification.propTypes = {
  bottomContentPadding: PropTypes.bool,
  className: PropTypes.string,
  header: PropTypes.node,
  headerClassName: PropTypes.string,
  content: PropTypes.node,
  notificationClassName: PropTypes.string,
  open: PropTypes.bool,
  toggleable: PropTypes.bool,
  type: PropTypes.oneOf(["success", "info", "warning", "error"]),
  displayStyle: PropTypes.oneOf(["flat", "elevated"]),
  onClose: PropTypes.func,
};
