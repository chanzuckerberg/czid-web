import cx from "classnames";
import React from "react";
import cs from "./view_header.scss";

interface ViewHeaderControlsProps {
  children: React.ReactNode,
  className?: string,
}

function ViewHeaderControls(props: ViewHeaderControlsProps) {
  return (
    <div className={cx(cs.controls, props.className)}>
      {props.children}
    </div>
  );
}

ViewHeaderControls.CLASS_NAME = "ViewHeaderControls";

export default ViewHeaderControls;
