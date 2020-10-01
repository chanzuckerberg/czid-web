import React from "react";
import PropTypes from "prop-types";

import IconArrowDownSmall from "./IconArrowDownSmall";
import IconArrowUpSmall from "./IconArrowUpSmall";

const SortIcon = ({ className, sortDirection }) => {
  return sortDirection === "ascending" ? (
    <IconArrowDownSmall className={className} />
  ) : (
    <IconArrowUpSmall className={className} />
  );
};

SortIcon.propTypes = {
  className: PropTypes.string,
  sortDirection: PropTypes.oneOf(["ascending", "descending"]),
};

export default SortIcon;
