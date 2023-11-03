import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import { REPORT_TABLE_COLUMNS } from "~/components/views/SampleView/utils";
import {
  ColumnProps,
  DBType,
  SortFunctionsParams,
} from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";
import { NUMBER_NULL_VALUES } from "../../ReportTable";
import { getBase10ExponentRenderer } from "./renderers/base10ExponentRenderer";
import { getCellValueRenderer } from "./renderers/cellValueRenderer";
import { getNtNrSelectorRenderer } from "./renderers/ntNrSelectorRenderer";
import { getCountTypeValuesFromDataRow, nestedNtNrSortFunction } from "./utils";

// @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
export const getSharedColumns: (
  dbType: DBType,
  handleNtNrChange: (selectedDbType: "nr" | "nt") => void,
  numericColumnWidth: number,
) => Array<ColumnProps> = (dbType, handleNtNrChange, numericColumnWidth) => {
  const countTypes = ["nt", "nr"];

  return [
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "percent_identity",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType, 1),
      columnData: REPORT_TABLE_COLUMNS["percentidentity"],
      dataKey: "percent_identity",
      label: "%id",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["percent_identity"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: numericColumnWidth,
    },
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "alignment_length",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType, 1),
      columnData: REPORT_TABLE_COLUMNS["alignmentlength"],
      dataKey: "alignment_length",
      label: "L",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["alignment_length"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: numericColumnWidth,
    },
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "e_value",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getBase10ExponentRenderer(dbType),
      columnData: REPORT_TABLE_COLUMNS["evalue"],
      dataKey: "e_value",
      label: "E value",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["e_value"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: numericColumnWidth,
    },
    {
      dataKey: "ntnrSelector",
      disableSort: true,
      headerClassName: cs.ntnrSelectorHeader,
      headerRenderer: getNtNrSelectorRenderer(dbType, handleNtNrChange),
      width: 40,
    },
  ];
};
