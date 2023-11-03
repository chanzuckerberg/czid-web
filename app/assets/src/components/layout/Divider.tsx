import cx from "classnames";
import React from "react";
import cs from "./divider.scss";

interface DividerProps {
  style?: "thin" | "medium";
}

const Divider = ({ style }: DividerProps) => {
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
  return <div className={cx(cs.divider, cs[style])} />;
};

Divider.defaultProps = {
  style: "thin",
};

export default Divider;
