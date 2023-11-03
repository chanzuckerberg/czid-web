import {
  NANOPORE_DEFAULT_COLUMN_WIDTH,
  REPORT_TABLE_COLUMNS,
} from "~/components/views/SampleView/utils";
import {
  ColumnProps,
  DBType,
  SortFunctionsParams,
} from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";
import { NUMBER_NULL_VALUES } from "../../ReportTable";
import { getCellValueRenderer } from "./renderers/cellValueRenderer";
import { getCountTypeValuesFromDataRow, nestedNtNrSortFunction } from "./utils";

// @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
export const getNanoporeColumns: (
  dbType: DBType,
) => Array<ColumnProps> = dbType => {
  const countTypes = ["nt", "nr"];

  return [
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "bpm",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType, 1),
      columnData: REPORT_TABLE_COLUMNS["bpm"],
      dataKey: "bpm",
      label: "bPM",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["bpm"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: NANOPORE_DEFAULT_COLUMN_WIDTH,
    },
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "base_count",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType),
      columnData: REPORT_TABLE_COLUMNS["b"],
      dataKey: "b",
      label: "b",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["base_count"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: NANOPORE_DEFAULT_COLUMN_WIDTH,
    },
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "count",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType),
      columnData: REPORT_TABLE_COLUMNS["r_ont"],
      dataKey: "r",
      label: "r",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["count"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: NANOPORE_DEFAULT_COLUMN_WIDTH,
    },
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "contigs",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType),
      columnData: REPORT_TABLE_COLUMNS["contigs"],
      dataKey: "contigs",
      label: "contig",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["contigs"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: NANOPORE_DEFAULT_COLUMN_WIDTH,
    },
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "contig_b",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType),
      columnData: REPORT_TABLE_COLUMNS["contigbases"],
      dataKey: "contig_b",
      label: "contig b",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["contig_b"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: NANOPORE_DEFAULT_COLUMN_WIDTH,
    },
  ];
};
