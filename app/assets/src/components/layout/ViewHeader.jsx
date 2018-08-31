import PropTypes from "prop-types";
import React from "react";

const ViewHeader = ({ title, preTitle, subTitle, children }) => {
  if (children && !Array.isArray(children)) {
    children = [children];
  }
  return (
    <div className="view-header">
      <div className="view-header__left">
        <div className="view-header__left__pre-title">{preTitle}</div>
        <div className="view-header__left__title">{title}</div>
        <div className="view-header__left__sub-title">{subTitle}</div>
      </div>
      <div className="view-header__right">
        {(children || []).map((child, idx) => {
          return (
            <span key={idx} className="view-header__right__wrapper">
              {child}
            </span>
          );
        })}
      </div>
    </div>
  );
};

ViewHeader.propTypes = {
  title: PropTypes.string,
  preTitle: PropTypes.string,
  subTitle: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default ViewHeader;
