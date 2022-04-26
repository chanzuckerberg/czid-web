import { get } from "lodash/fp";

import { FIELDS_METADATA } from "~/components/utils/tooltip";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { SAMPLE_TABLE_COLUMNS_V2 } from "~/components/views/samples/constants";
import { WORKFLOWS } from "~utils/workflows";
import cs from "./samples_view.scss";

export const computeColumnsByWorkflow = ({
  basicIcon = false,
  allowedFeatures = [],
} = {}) => {
  const columnsByWorkflow = {};

  columnsByWorkflow[WORKFLOWS.SHORT_READ_MNGS.value] = [
    {
      dataKey: "sample",
      flexGrow: 1,
      width: 350,
      cellRenderer: ({ cellData }) =>
        TableRenderers.renderSample({
          sample: cellData,
          full: true,
          basicIcon,
        }),
      headerClassName: cs.sampleHeader,
    },
    {
      dataKey: "createdAt",
      label: "Created On",
      width: 120,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderDateWithElapsed,
      // Get latest run or fallback to sample createdAt
      cellDataGetter: ({ rowData }) =>
        get("sample.pipelineRunCreatedAt", rowData) || rowData.createdAt,
    },
    {
      dataKey: "host",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "collectionLocationV2",
      label: "Location",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "totalReads",
      label: "Total Reads",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "nonHostReads",
      label: "Passed Filters",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderNumberAndPercentage,
    },
    {
      dataKey: "qcPercent",
      label: "Passed QC",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "duplicateCompressionRatio",
      label: "DCR",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "erccReads",
      label: "ERCC Reads",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "notes",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "nucleotideType",
      label: "Nucleotide Type",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "pipelineVersion",
      label: "Pipeline Version",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "sampleType",
      label: "Sample Type",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "subsampledFraction",
      label: "SubSampled Fraction",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "totalRuntime",
      label: "Total Runtime",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatDuration(rowData[dataKey]),
    },
    {
      dataKey: "waterControl",
      label: "Water Control",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "meanInsertSize",
      label: "Mean Insert Size",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
  ];
  for (const col of columnsByWorkflow[WORKFLOWS.SHORT_READ_MNGS.value]) {
    col["columnData"] = SAMPLE_TABLE_COLUMNS_V2[col["dataKey"]];
  }

  columnsByWorkflow[WORKFLOWS.CONSENSUS_GENOME.value] = [
    {
      dataKey: "sample",
      flexGrow: 1,
      width: 350,
      disableSort: true,
      cellRenderer: ({ rowData }) =>
        TableRenderers.renderSampleInfo({
          rowData,
          full: true,
          basicIcon,
        }),
      headerClassName: cs.sampleHeader,
    },
    {
      dataKey: "createdAt",
      label: "Created On",
      width: 120,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderDateWithElapsed,
    },
    {
      dataKey: "host",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "collectionLocationV2",
      label: "Location",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "notes",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "nucleotideType",
      label: "Nucleotide Type",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "sampleType",
      label: "Sample Type",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "waterControl",
      label: "Water Control",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "coverageDepth",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "totalReadsCG",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "gcPercent",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "refSnps",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "percentIdentity",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "nActg",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "percentGenomeCalled",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "nMissing",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "nAmbiguous",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "wetlabProtocol",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "technology",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "referenceGenome",
      flexGrow: 1,
      width: 200,
      className: cs.basicCell,
      cellRenderer: ({ cellData }) =>
        TableRenderers.renderReferenceGenome(cellData),
    },
    {
      dataKey: "referenceGenomeLength",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "vadrPassFail",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "medakaModel",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "ctValue",
      label: "Ct Value",
      flexGrow: 1,
      className: cs.basicCell,
    },
  ];

  for (const col of columnsByWorkflow[WORKFLOWS.CONSENSUS_GENOME.value]) {
    const dataKey = col["dataKey"];
    if (
      Object.prototype.hasOwnProperty.call(SAMPLE_TABLE_COLUMNS_V2, dataKey)
    ) {
      col["columnData"] = SAMPLE_TABLE_COLUMNS_V2[dataKey];
    } else if (Object.prototype.hasOwnProperty.call(FIELDS_METADATA, dataKey)) {
      col["columnData"] = FIELDS_METADATA[dataKey];
      col["label"] = FIELDS_METADATA[dataKey].label;
    }
  }

  return columnsByWorkflow;
};

export const DEFAULTS_BY_WORKFLOW = {
  [WORKFLOWS.SHORT_READ_MNGS.value]: [
    "sample",
    "createdAt",
    "host",
    "collectionLocationV2",
    "nonHostReads",
    "qcPercent",
  ],
  [WORKFLOWS.CONSENSUS_GENOME.value]: [
    "sample",
    "referenceGenome",
    "createdAt",
    "host",
    "collectionLocationV2",
    "totalReadsCG",
    "percentGenomeCalled",
    "vadrPassFail",
  ],
};
