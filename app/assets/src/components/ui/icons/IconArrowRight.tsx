import cx from "classnames";
import React from "react";
import { IconProps } from "~/interface/icon";
import cs from "./icon_arrow_right.scss";

const IconArrowRight = ({ className }: IconProps) => {
  return <i className={cx("fa fa-chevron-right", cs.icon, className)} />;
};

export default IconArrowRight;
