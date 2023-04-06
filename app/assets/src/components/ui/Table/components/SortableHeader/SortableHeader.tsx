import { Header } from "@tanstack/react-table";
import { CellHeader } from "czifui";
import React, { CSSProperties, ReactNode } from "react";
import { TooltipText } from "./components/TooltipText";
import { TooltipTextType } from "./components/TooltipText/types";
import cs from "./sortable_header.scss";

interface SortableProps {
  header: Header<any, any>;
  children: ReactNode & string;
  tooltipStrings?: TooltipTextType;
  style?: CSSProperties;
}

export const SortableHeader = ({
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
      className={cs.wrapper}
      key={header.id}
      onClick={onClick}
      direction={sortDirection}
      active={Boolean(sortDirection)}
      hideSortIcon={!sortable}
      shouldShowTooltipOnHover={shouldShowTooltip}
      tooltipProps={{
        arrow: true,
        sdsStyle: "light",
        title: <TooltipText tooltipStrings={tooltipStrings} />,
        enterDelay: 1000,
        enterNextDelay: 300,
      }}
      {...props}>
      {children}
    </CellHeader>
  );
};
