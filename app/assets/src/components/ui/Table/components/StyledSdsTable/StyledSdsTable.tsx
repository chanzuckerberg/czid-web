import { Table, TableProps } from "czifui";
import React from "react";
import cs from "./styled_sds_table.scss";

export const StyledSdsTable = React.forwardRef<HTMLTableElement, TableProps>(
  function styledTable(props, ref) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    return <Table {...props} className={cs.styledTable} ref={ref} />;
  },
);
