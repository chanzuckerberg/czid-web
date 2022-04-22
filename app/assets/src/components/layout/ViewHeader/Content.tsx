import React from "react";

import cs from "./view_header.scss";

// eslint-disable-next-line no-empty-pattern
function Content({} : ViewHeaderContentProps) {
  return (
    <div className={cs.content}>{this.props.children}</div>
  );
}

interface ViewHeaderContentProps {
  children: React.ReactNode,
  className?: string
}

Content.CLASS_NAME = "ViewHeaderContent";

export default Content;
