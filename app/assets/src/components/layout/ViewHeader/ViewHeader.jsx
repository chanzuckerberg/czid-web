// ViewHeader ignores all children that are not ViewHeader.Content or ViewHeader.Controls.
import PropTypes from "prop-types";
import React from "react";
import Content from "./Content";
import Pretitle from "./Pretitle";
import Controls from "./Controls";
import Title from "./Title";
import cx from "classnames";
import extractChildren from "../../utils/extractChildren";
import cs from "./view_header.scss";

const ViewHeader = ({ className, children }) => {
  const [content, controls] = extractChildren(children, [
    Content.CLASS_NAME,
    Controls.CLASS_NAME
  ]);

  return (
    <div className={cx(cs.viewHeader, className)}>
      {content}
      <div className={cs.fill} />
      {controls}
    </div>
  );
};

ViewHeader.Content = Content;
ViewHeader.Controls = Controls;
ViewHeader.Title = Title;
ViewHeader.Pretitle = Pretitle;

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
