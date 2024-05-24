import { Tooltip } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import cs from "./value_with_tooltip.scss";

interface ValueWithTooltipProps {
  tooltipTitle?: string;
  className?: string;
  children?: string | React.ReactNode;
  cellData?: string;
}

export const ValueWithTooltip = ({
  tooltipTitle,
  cellData,
  className = "",
  children,
}: ValueWithTooltipProps) => {
  return (
    <Tooltip
      arrow
      placement="top-start"
      title={tooltipTitle ?? children}
      width="wide"
      sdsStyle="light"
    >
      <div className={cx(cs.base, className)}>{cellData || children}</div>
    </Tooltip>
  );
};
