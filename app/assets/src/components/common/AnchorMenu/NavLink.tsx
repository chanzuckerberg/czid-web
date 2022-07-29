import cx from "classnames";
import React, { MouseEventHandler } from "react";
import cs from "./nav_link.scss";

interface NavLinkProps {
  id: string;
  isCurrent: boolean;
  name: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
}

const NavLink = ({ id, isCurrent, name, onClick }: NavLinkProps) => (
  <li className={cx(cs.navLink, isCurrent ? cs.currentNavItem : cs.navItem)}>
    <a href={id} onClick={onClick}>
      {name}
    </a>
  </li>
);

export default NavLink;
