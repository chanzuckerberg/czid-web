import cx from "classnames";
import React from "react";
import cs from "./view_header.scss";

function ViewHeaderControls(props: ViewHeaderControlsProps) {
    return (
      <div className={cx(cs.controls, props.className)}>
        {props.children}
      </div>
    );
}

interface ViewHeaderControlsProps {
  children: React.ReactNode,
  className?: string
}

ViewHeaderControls.CLASS_NAME = "ViewHeaderControls";

export default ViewHeaderControls;
