import { TableRow, TableRowProps } from "@czi-sds/components";
import React from "react";
import cs from "./styled_table_row.scss";

export const StyledTableRow = React.forwardRef<
  HTMLTableRowElement,
  TableRowProps
>(function styledTableRow(props, ref) {
  return (
    <TableRow
      data-testid="amr-table-row"
      {...props}
      className={cs.styledTableRow}
      ref={ref}
      rev={null}
    />
  );
});
