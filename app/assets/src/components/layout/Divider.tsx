import cx from "classnames";
import React from "react";
import cs from "./divider.scss";

interface DividerProps {
  style?: "thin" | "medium";
}

const Divider = ({ style }: DividerProps) => {
  return <div className={cx(cs.divider, cs[style])} />;
};

Divider.defaultProps = {
  style: "thin",
};

export default Divider;
