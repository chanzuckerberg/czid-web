import { Column, Header } from "@tanstack/react-table";
import { CSSProperties } from "react";

export const generateWidthStyles = (
  column: Column<any, any>,
): CSSProperties => {
  return {
    width: `${column.getSize()}px`,
  };
};

export const generateHeaderWidthStyles = (
  header: Header<any, any>,
): CSSProperties => {
  return {
    width: `${header.getSize()}px`,
  };
};

export const generateSlimWidthStyles = () => {
  return {
    width: "unset",
    minWidth: "unset",
  };
};
