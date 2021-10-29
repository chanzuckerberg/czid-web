import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import cs from "./nav_link.scss";

const NavLink = ({ id, isCurrent, name, onClick }) => (
  <li
    className={cx(cs.navLink, isCurrent ? cs.currentNavItem : cs.navItem)}
    onClick={onClick}
  >
    <a href={id}>{name}</a>
  </li>
);

NavLink.propTypes = {
  id: PropTypes.string,
  isCurrent: PropTypes.bool,
  name: PropTypes.string,
  onClick: PropTypes.func,
};

export default NavLink;
