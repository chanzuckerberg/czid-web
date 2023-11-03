import {
  ASSEMBLY_FEATURE,
  isPipelineFeatureAvailable,
} from "~/components/utils/pipeline_versions";
import { REPORT_TABLE_COLUMNS } from "~/components/views/SampleView/utils";
import {
  ColumnProps,
  DBType,
  SortFunctionsParams,
} from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";
import { NUMBER_NULL_VALUES } from "../../ReportTable";
import { getAggregateScoreRenderer } from "./renderers/aggregateScoreRenderer";
import { getCellValueRenderer } from "./renderers/cellValueRenderer";
import { getZScoreRenderer } from "./renderers/zScoreRenderer";
import {
  getCountTypeValuesFromDataRow,
  nestedNtNrSortFunction,
  nestedSortFunction,
} from "./utils";

// @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
export const getIlluminaColumns: (
  dbType: DBType,
  displayNoBackground: boolean,
  pipelineVersion?: string,
) => Array<ColumnProps> = (dbType, displayNoBackground, pipelineVersion) => {
  const countTypes = ["nt", "nr"];
  const assemblyEnabled = isPipelineFeatureAvailable(
    ASSEMBLY_FEATURE,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    pipelineVersion,
  );

  return [
    {
      cellRenderer: getAggregateScoreRenderer(displayNoBackground),
      columnData: REPORT_TABLE_COLUMNS["NT_aggregatescore"],
      dataKey: "agg_score",
      label: "Score",
      width: 130,
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedSortFunction({
          data,
          sortDirection,
          path: ["agg_score"],
          nullValue: NUMBER_NULL_VALUES[0],
          limits: NUMBER_NULL_VALUES,
        }),
      disableSort: displayNoBackground,
    },
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "z_score",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getZScoreRenderer(dbType, displayNoBackground),
      columnData: REPORT_TABLE_COLUMNS["zscore"],
      dataKey: "z_score",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["z_score"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      disableSort: displayNoBackground,
      width: 65,
    },
    {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "rpm",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType, 1), // TODO: doesn't look like this is changing when dbType changes
      columnData: REPORT_TABLE_COLUMNS["rpm"],
      dataKey: "rpm",
      label: "rPM",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["rpm"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: 75,
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
      columnData: REPORT_TABLE_COLUMNS["r"],
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
      width: 75,
    },
    assemblyEnabled && {
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
      width: 75,
    },
    assemblyEnabled && {
      cellDataGetter: ({ rowData }: { rowData: Taxon }) =>
        getCountTypeValuesFromDataRow({
          rowData,
          field: "contig_r",
          defaultValue: 0,
          countTypes: countTypes,
        }),
      cellRenderer: getCellValueRenderer(dbType),
      columnData: REPORT_TABLE_COLUMNS["contigreads"],
      dataKey: "contig_r",
      label: "contig r",
      sortFunction: ({ data, sortDirection }: SortFunctionsParams) =>
        nestedNtNrSortFunction({
          dbType: dbType,
          data,
          sortDirection,
          path: ["contig_r"],
          nullValue: 0,
          limits: NUMBER_NULL_VALUES,
        }),
      width: 75,
    },
  ];
};
