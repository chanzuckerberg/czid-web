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
}

export const SortableHeader = ({
  className,
  header,
  children,
  tooltipStrings,
  ...props
}: SortableProps): JSX.Element => {
  const { getCanSort, getIsSorted, getToggleSortingHandler } = header.column;

  const sortable = getCanSort();
  const sortDirection = getIsSorted() || undefined;
  const onClick = getToggleSortingHandler();
  const shouldShowTooltip = Boolean(tooltipStrings);

  return (
    <CellHeader
      className={cx(cs.wrapper, className)}
      key={header.id}
      onClick={onClick}
      direction={sortDirection}
      active={Boolean(sortDirection)}
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
