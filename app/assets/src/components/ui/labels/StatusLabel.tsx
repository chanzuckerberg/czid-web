import cx from "classnames";
import React from "react";

import BasicPopup from "~/components/BasicPopup";

import cs from "./status_label.scss";

interface StatusLabelProps {
  className?: string;
  status?: React.ReactNode;
  type?: "beta" | "default" | "error" | "info" | "success" | "warning";
  tooltipText?: string;
  inline?: boolean;
}

class StatusLabel extends React.Component<StatusLabelProps> {
  static defaultProps: { type: "default" };
  render() {
    const { status, type, className, tooltipText, inline } = this.props;
    const label = (
      <div
        className={cx(className, cs.statusLabel, inline && cs.inline, cs[type])}
      >
        {status}
      </div>
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

export default StatusLabel;
