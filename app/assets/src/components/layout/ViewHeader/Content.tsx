import React from "react";
import cs from "./view_header.scss";

interface ViewHeaderContentProps {
  children: React.ReactNode;
  className?: string;
}

function ViewHeaderContent(props: ViewHeaderContentProps) {
  return <div className={cs.content}>{props.children}</div>;
}

ViewHeaderContent.CLASS_NAME = "ViewHeaderContent";

export default ViewHeaderContent;
