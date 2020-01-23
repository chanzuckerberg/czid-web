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
    const { className, header, content, type, open } = this.props;
    const notification = (
      <Notification
        type={type}
        displayStyle="flat"
        className={cs.notificationContainer}
      >
        {header}
      </Notification>
    );

    return (
      <div className={cx(cs.AccordionNotification, className)}>
        <Accordion
          bottomContentPadding
          header={notification}
          open={open}
          className={cx(cs.listContainer, cs[type])}
          toggleAlignment="baseline"
        >
          <div className={cs.messageContainer}>{content}</div>
        </Accordion>
      </div>
    );
  }
}

AccordionNotification.defaultProps = {
  type: "info",
};

AccordionNotification.propTypes = {
  className: PropTypes.string,
  header: PropTypes.node,
  content: PropTypes.node,
  open: PropTypes.bool,
  type: PropTypes.oneOf(["success", "info", "warn", "error"]),
};
