import React from "react";
import { IconSortProps } from "~/interface/icon";
import IconArrowDownSmall from "./IconArrowDownSmall";
import IconArrowUpSmall from "./IconArrowUpSmall";

const SortIcon = ({ className, sortDirection }: IconSortProps) => {
  return sortDirection === "ascending" ? (
    <IconArrowUpSmall className={className} />
  ) : (
    <IconArrowDownSmall className={className} />
  );
};

export default SortIcon;
