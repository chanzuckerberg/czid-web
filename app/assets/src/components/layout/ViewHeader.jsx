import PropTypes from "prop-types";
import React from "react";

const ViewHeader = ({ title, preTitle, subTitle, children }) => {
  const wrapComponent = (breacrumb, className) => {
    return <span className={className}>{breacrumb}</span>;
  };

  if (Array.isArray(children)) {
    children = [children];
  }

  return (
    <div className="view-header">
      <div className="view-header__left">
        <div className="view-header__left__pretitle">{preTitle}</div>
        <div className="view-header__left__title">{title}</div>
        <div className="view-header__left__subtitle">{subTitle}</div>
      </div>
      <div className="view-header__right">
        {(children || []).map(child => {
          return wrapComponent(child, "view-header__right__c-wrap");
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
