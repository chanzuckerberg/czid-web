import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

export default class SortIcon extends React.Component {
  render() {
    const { sortDirection, className } = this.props;
    return sortDirection === "ascending" ? (
      <i className={cx("fa fa-angle-up", className)} />
    ) : (
      <i className={cx("fa fa-angle-down", className)} />
    );
  }
}

SortIcon.defaultProps = {
  sortDirection: "ascending",
};

SortIcon.propTypes = {
  sortDirection: PropTypes.oneOf(["ascending", "descending"]),
  className: PropTypes.string,
};
