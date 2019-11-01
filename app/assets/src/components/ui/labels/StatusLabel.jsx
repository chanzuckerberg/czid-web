import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import BasicPopup from "~/components/BasicPopup";

import cs from "./status_label.scss";

class StatusLabel extends React.Component {
  render() {
    const { status, type, className, tooltipText } = this.props;
    const label = (
      <div className={cx(className, cs.statusLabel, cs[type])}>{status}</div>
    );

    if (tooltipText) {
      return (
        <BasicPopup
          trigger={label}
          content={tooltipText}
          position="top center"
        />
      );
    }

    return label;
  }
}

StatusLabel.propTypes = {
  className: PropTypes.string,
  status: PropTypes.node,
  type: PropTypes.oneOf(["success", "warn", "error", "default"]),
  tooltipText: PropTypes.string,
};

StatusLabel.defaultProps = {
  type: "default",
};

export default StatusLabel;
