// ViewHeader ignores all children that are not ViewHeader.Content or ViewHeader.Controls.
import cx from "classnames";
import React from "react";
import extractChildren from "../../utils/extractChildren";
import Content from "./Content"
import Controls from "./Controls";
import Pretitle from "./Pretitle";
import Title from "./Title";
import cs from "./view_header.scss";

function ViewHeader({ className, children }: ViewHeaderProps) {
  const [content, controls] = extractChildren(children, [
    Content.CLASS_NAME,
    Controls.CLASS_NAME,
  ]);

  return (
    <div className={cx(cs.viewHeader, className)}>
      {content}
      <div className={cs.fill} />
      {controls}
    </div>
  );
}

ViewHeader.Content = Content;
ViewHeader.Controls = Controls;
ViewHeader.Title = Title;
ViewHeader.Pretitle = Pretitle;

interface ViewHeaderProps {
  className?: string,
  title?: string,
  preTitle?: string,
  subTitle?: string,
  children: React.ReactNode[] | React.ReactNode
}

export default ViewHeader;
