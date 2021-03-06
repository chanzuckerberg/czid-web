import { forbidExtraProps } from "airbnb-prop-types";
import PropTypes from "prop-types";
import cx from "classnames";
import React from "react";

import { nanoid } from "nanoid";
import cs from "./list.scss";

const List = ({
  dynamic,
  listClassName,
  listItems,
  itemClassName,
  ordered,
  smallSpacing,
  xsmallSpacing,
  xxsmallSpacing,
  ...props
}) => {
  const items = listItems.map((item, index) => {
    return (
      <li
        className={cx(
          cs.li,
          itemClassName,
          smallSpacing && cs.smallSpacing,
          xsmallSpacing && cs.xsmallSpacing,
          xxsmallSpacing && cs.xxsmallSpacing
        )}
        key={dynamic ? nanoid() : index}
      >
        {item}
      </li>
    );
  });
  if (ordered) {
    return (
      <ol className={cx(cs.ol, listClassName)} {...props}>
        {items}
      </ol>
    );
  } else {
    return (
      <ul className={cx(cs.ul, listClassName)} {...props}>
        {items}
      </ul>
    );
  }
};

List.propTypes = forbidExtraProps({
  dynamic: PropTypes.bool,
  listClassName: PropTypes.string,
  listItems: PropTypes.array,
  itemClassName: PropTypes.string,
  ordered: PropTypes.bool,
  smallSpacing: PropTypes.bool, // for $font-body-m, $font-body-l
  xsmallSpacing: PropTypes.bool, // for $font-body-xxs, $font-body-xs, $font-body-s
  xxsmallSpacing: PropTypes.bool, // for $font-body-xxxs
});

List.defaultProps = {
  dynamic: false,
  ordered: false,
  smallSpacing: false,
  xsmallSpacing: true,
  xxsmallSpacing: false,
};

export default List;
