import { Icon } from "@czi-sds/components";
import React, { forwardRef, LegacyRef } from "react";
import cs from "./tooltip_icon.scss";

const TooltipIcon = forwardRef(function TooltipIcon(
  props,
  ref: LegacyRef<HTMLSpanElement>,
) {
  return (
    <span {...props} ref={ref}>
      <Icon
        sdsIcon="infoCircle"
        sdsSize="s"
        sdsType="interactive"
        className={cs.infoIcon}
      />
    </span>
  );
});

export { TooltipIcon };
