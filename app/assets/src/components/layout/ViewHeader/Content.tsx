import React from "react";

import cs from "./view_header.scss";

function ViewHeaderContent(props : ViewHeaderContentProps) {
  return (
    <div className={cs.content}>{props.children}</div>
  );
}

interface ViewHeaderContentProps {
  children: React.ReactNode,
  className?: string
}

ViewHeaderContent.CLASS_NAME = "ViewHeaderContent";

export default ViewHeaderContent;
