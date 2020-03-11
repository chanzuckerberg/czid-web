import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import Notification from "~ui/notifications/Notification";
import Accordion from "~/components/layout/Accordion";

import cs from "./accordion_notification.scss";

export default class AccordionNotification extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      className,
      header,
      content,
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
        className={cx(cs.listContainer, cs[type])}
        toggleArrowAlignment="topRight"
      >
        <div className={cs.messageContainer}>{content}</div>
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
  type: PropTypes.oneOf(["success", "info", "warn", "error"]),
  displayStyle: PropTypes.oneOf(["flat", "elevated"]),
  onClose: PropTypes.func,
};
