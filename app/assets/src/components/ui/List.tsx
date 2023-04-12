import cx from "classnames";
import { nanoid } from "nanoid";
import React, { ReactFragment } from "react";
import cs from "./list.scss";

interface ListProps {
  dynamic: boolean;
  listClassName?: string;
  listItems: Array<ReactFragment>;
  itemClassName?: string;
  ordered: boolean;
  smallSpacing: boolean; // for $font-body-m; $font-body-l
  xsmallSpacing: boolean; // for $font-body-xxs; $font-body-xs; $font-body-s
  xxsmallSpacing: boolean; // for $font-body-xxxs
}

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
}: ListProps) => {
  const items = listItems.map((item, index) => {
    return (
      <li
        className={cx(
          cs.li,
          itemClassName,
          smallSpacing && cs.smallSpacing,
          xsmallSpacing && cs.xsmallSpacing,
          xxsmallSpacing && cs.xxsmallSpacing,
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

List.defaultProps = {
  dynamic: false,
  ordered: false,
  smallSpacing: false,
  xsmallSpacing: true,
  xxsmallSpacing: false,
};

export default List;
