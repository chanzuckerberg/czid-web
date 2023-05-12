import { Header } from "@tanstack/react-table";
import cx from "classnames";
import { CellHeader } from "czifui";
import React, { CSSProperties, ReactNode } from "react";
import { TooltipText } from "./components/TooltipText";
import { TooltipTextType } from "./components/TooltipText/types";
import cs from "./sortable_header.scss";

interface SortableProps {
  className?: string;
  header: Header<any, any>;
  children: ReactNode | string;
  tooltipStrings?: TooltipTextType;
  style?: CSSProperties;
  isSortDefaultDesc?: boolean;
}

export const SortableHeader = ({
  className,
  header,
  children,
  tooltipStrings,
  isSortDefaultDesc = true,
  ...props
}: SortableProps): JSX.Element => {
  const { getCanSort, getIsSorted, toggleSorting } = header.column;

  const sortable = getCanSort();
  const sortDirection = getIsSorted() || undefined;
  const isActive = Boolean(sortDirection);

  // If it's sorted in descending order, we want to sort by ascending order
  // If the column is already sorted in ascending order, we want to switch to descending
  // If the column is not active the new sort will follow the isSortDefaultDesc prop
  const onClick = () => {
    const isCurrentSortDesc = sortDirection === "desc";
    const isNewSortDesc = isActive ? !isCurrentSortDesc : isSortDefaultDesc;
    toggleSorting(isNewSortDesc);
  };

  const shouldShowTooltip = Boolean(tooltipStrings);

  return (
    <CellHeader
      className={cx(cs.wrapper, isActive && cs.active, className)}
      key={header.id}
      onClick={onClick}
      direction={sortDirection}
      active={isActive}
      hideSortIcon={!sortable}
      shouldShowTooltipOnHover={shouldShowTooltip}
      tooltipProps={{
        sdsStyle: "light",
        title: <TooltipText tooltipStrings={tooltipStrings} />,
        enterNextDelay: 800,
      }}
      {...props}
    >
      {children}
    </CellHeader>
  );
};
