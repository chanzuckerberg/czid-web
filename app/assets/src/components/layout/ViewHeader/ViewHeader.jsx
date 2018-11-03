// ViewHeader ignores all children that are not ViewHeader.Content or ViewHeader.RightControls
import PropTypes from "prop-types";
import React from "react";
import Content from "./Content";
import RightControls from "./RightControls";
import Title from "./Title";
import cx from "classnames";
import extractChildren from "../../utils/extractChildren";
import cs from "./view_header.scss";

const ViewHeader = ({ className, children }) => {
  const {
    "ViewHeader.Content": content,
    "ViewHeader.RightControls": rightControls
  } = extractChildren(children, [
    "ViewHeader.Content",
    "ViewHeader.RightControls"
  ]);

  return (
    <div className={cx(cs.viewHeader, className)}>
      {content}
      <div className={cs.fill} />
      {rightControls}
    </div>
  );
};

ViewHeader.Content = Content;
ViewHeader.RightControls = RightControls;
ViewHeader.Title = Title;

ViewHeader.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  preTitle: PropTypes.string,
  subTitle: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default ViewHeader;
