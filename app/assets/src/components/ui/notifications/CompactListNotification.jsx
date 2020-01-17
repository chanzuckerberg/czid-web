import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import Notification from "~ui/notifications/Notification";
import Accordion from "~/components/layout/Accordion";

import cs from "./compact_list_notification.scss";

export default class CompactListNotification extends React.Component {
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
      height,
      displayStyle,
    } = this.props;
    const notification = (
      <Notification
        type={type}
        displayStyle={displayStyle}
        className={cs.notificationContainer}
      >
        {header}
      </Notification>
    );

    return (
      <div className={cx(cs.compactListNotification, className)}>
        <Accordion
          bottomContentPadding
          header={notification}
          open={open}
          className={cx(cs.listContainer, cs[type])}
        >
          {content}
        </Accordion>
      </div>
    );
  }
}

CompactListNotification.defaultProps = {
  type: "info",
};

CompactListNotification.propTypes = {
  className: PropTypes.string,
  header: PropTypes.node,
  content: PropTypes.node,
  open: PropTypes.bool,
  type: PropTypes.oneOf(["success", "info", "warn", "error"]),
  displayStyle: PropTypes.oneOf(["flat", "elevated"]),
};
