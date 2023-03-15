import { Column } from "@tanstack/react-table";
import { CSSProperties } from "react";

export const generateWidthStyles = (
  column: Column<any, any>,
): CSSProperties => {
  return {
    width: `${column.getSize()}px`,
  };
};
