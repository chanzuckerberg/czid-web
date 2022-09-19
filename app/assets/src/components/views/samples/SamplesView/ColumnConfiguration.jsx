import { get } from "lodash/fp";

import { FIELDS_METADATA } from "~/components/utils/tooltip";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import { SAMPLE_TABLE_COLUMNS_V2 } from "~/components/views/samples/constants";
import { WORKFLOWS } from "~utils/workflows";
import cs from "./samples_view.scss";

export const computeColumnsByWorkflow = ({
  workflow,
  metadataFields = [],
  basicIcon = false,
} = {}) => {
  if (workflow === WORKFLOWS.SHORT_READ_MNGS.value) {
    return computeMngsColumns({ basicIcon, metadataFields });
  } else if (workflow === WORKFLOWS.CONSENSUS_GENOME.value) {
    return computeConsensusGenomeColumns({ basicIcon, metadataFields });
  } else if (workflow === WORKFLOWS.AMR.value) {
    return computeAmrColumns({ basicIcon, metadataFields });
  }
};

const computeMngsColumns = ({ basicIcon, metadataFields }) => {
  const fixedColumns = [
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
      dataKey: "collection_location_v2",
      label: "Location",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "totalReads",
      label: "Total Reads",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "nonHostReads",
      label: "Passed Filters",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderNumberAndPercentage,
    },
    {
      dataKey: "qcPercent",
      label: "Passed QC",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "duplicateCompressionRatio",
      label: "DCR",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "erccReads",
      label: "ERCC Reads",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "nucleotide_type",
      label: "Nucleotide Type",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "sample_type",
      label: "Sample Type",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "water_control",
      label: "Water Control",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "notes",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "pipelineVersion",
      label: "Pipeline Version",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "subsampledFraction",
      label: "SubSampled Fraction",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "totalRuntime",
      label: "Total Runtime",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatDuration(rowData[dataKey]),
    },
    {
      dataKey: "meanInsertSize",
      label: "Mean Insert Size",
      flexGrow: 1,
      className: cs.basicCell,
    },
  ];

  const columns = [...fixedColumns, ...computeMetadataColumns(metadataFields)];

  for (const col of columns) {
    col["columnData"] = SAMPLE_TABLE_COLUMNS_V2[col["dataKey"]];
  }

  return columns;
};

const computeConsensusGenomeColumns = ({ basicIcon, metadataFields }) => {
  const fixedColumns = [
    {
      dataKey: "sample",
      flexGrow: 1,
      width: 350,
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
      dataKey: "collection_location_v2",
      label: "Location",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "nucleotide_type",
      label: "Nucleotide Type",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "sample_type",
      label: "Sample Type",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "water_control",
      label: "Water Control",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "notes",
      flexGrow: 1,
      disableSort: true,
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
      dataKey: "referenceAccession",
      flexGrow: 1,
      width: 200,
      className: cs.basicCell,
      cellRenderer: ({ cellData }) =>
        TableRenderers.renderReferenceAccession(cellData),
    },
    {
      dataKey: "referenceAccessionLength",
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
      dataKey: "ct_value",
      label: "Ct Value",
      flexGrow: 1,
      className: cs.basicCell,
    },
  ];

  const columns = [...fixedColumns, ...computeMetadataColumns(metadataFields)];

  for (const col of columns) {
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

  return columns;
};

const computeAmrColumns = ({ basicIcon, metadataFields }) => {
  const fixedColumns = [
    {
      dataKey: "sample",
      flexGrow: 1,
      width: 350,
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
      dataKey: "sample_type",
      label: "Sample Type",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "host",
      flexGrow: 1,
      className: cs.basicCell,
    },
  ];

  const columns = [...fixedColumns, ...computeMetadataColumns(metadataFields)];

  for (const col of columns) {
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

  return columns;
};

const computeMetadataColumns = metadataFields => {
  // The following metadata fields are hard-coded in fixedColumns
  // and will always be available on the samples table.
  const fixedMetadata = [
    "sample_type",
    "nucleotide_type",
    "water_control",
    "collection_location_v2",
    "ct_value",
  ];

  const additionalMetadata = metadataFields.filter(
    mf => !fixedMetadata.includes(mf["key"]),
  );

  const metadataColumns = additionalMetadata.map(mf => {
    return {
      dataKey: mf["key"],
      label: mf["name"],
      flexGrow: 1,
      className: cs.basicCell,
    };
  }, []);

  return metadataColumns;
};

export const DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW = {
  [WORKFLOWS.SHORT_READ_MNGS.value]: [
    "sample",
    "createdAt",
    "host",
    "collection_location_v2",
    "nonHostReads",
    "qcPercent",
  ],
  [WORKFLOWS.CONSENSUS_GENOME.value]: [
    "sample",
    "referenceAccession",
    "createdAt",
    "host",
    "collection_location_v2",
    "totalReadsCG",
    "percentGenomeCalled",
    "vadrPassFail",
  ],
  [WORKFLOWS.AMR.value]: ["sample", "createdAt", "sample_type", "host"],
};

// DEFAULT_SORTED_COLUMN_BY_TAB (frontend) should always match TIEBREAKER_SORT_KEY (backend).
export const DEFAULT_SORTED_COLUMN_BY_TAB = {
  projects: "created_at",
  samples: "createdAt",
  visualizations: "updated_at",
};
