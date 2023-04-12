import { Column, Header } from "@tanstack/react-table";
import { CSSProperties } from "react";

export const generateWidthStyles = (
  column: Column<any, any>,
): CSSProperties => {
  return {
    minWidth: `${column.getSize()}px`,
    width: `${column.getSize()}px`,
  };
};

export const generateHeaderWidthStyles = (
  header: Header<any, any>,
): CSSProperties => {
  return {
    minWidth: `${header.getSize()}px`,
  };
};
