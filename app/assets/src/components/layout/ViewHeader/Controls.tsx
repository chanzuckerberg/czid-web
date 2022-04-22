import cx from "classnames";
import React from "react";
import cs from "./view_header.scss";

// eslint-disable-next-line no-empty-pattern
function Controls({}: ViewHeaderControlsProps) {
    return (
      <div className={cx(cs.controls, this.props.className)}>
        {this.props.children}
      </div>
    );
}

interface ViewHeaderControlsProps {
  children: React.ReactNode,
  className?: string
}

Controls.CLASS_NAME = "ViewHeaderControls";

export default Controls;
