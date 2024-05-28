import cx from "classnames";
import React from "react";
import BasicPopup from "~/components/common/BasicPopup";
import cs from "./status_label.scss";

interface StatusLabelProps {
  className?: string;
  status?: React.ReactNode;
  type?: "beta" | "default" | "error" | "info" | "success" | "warning";
  tooltipText?: string;
  inline?: boolean;
}
const StatusLabel = ({
  status,
  type = "default",
  className,
  tooltipText,
  inline,
}: StatusLabelProps) => {
  const label = (
    <div
      className={cx(className, cs.statusLabel, inline && cs.inline, cs[type])}
      data-testid={status}
    >
      {status}
    </div>
  );

  if (tooltipText) {
    return (
      <BasicPopup trigger={label} content={tooltipText} position="top center" />
    );
  }

  return label;
};

export default StatusLabel;
