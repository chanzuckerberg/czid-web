import React from "react";
import PropTypes from "prop-types";

const FilterRow = ({ children }) => {
  if (children && !Array.isArray(children)) {
    children = [children];
  }

  return (
    <div className="filter-row">
      {(children || []).map((child, idx) => {
        return (
          <span className="filter-row__wrapper" key={idx}>
            {child}
          </span>
        );
      })}
    </div>
  );
};

FilterRow.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default FilterRow;
