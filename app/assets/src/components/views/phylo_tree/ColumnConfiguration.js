import { get } from "lodash/fp";
import React from "react";
import Moment from "react-moment";

import { formatPercent } from "~/components/utils/format";
import {
  isPipelineFeatureAvailable,
  ACCESSION_COVERAGE_STATS_FEATURE,
} from "~/components/utils/pipeline_versions";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import cs from "./phylo_tree_creation_modal.scss";

export const COLUMNS = [
  {
    dataKey: "project_name", // The project column is only relevant for "Additional Samples"
    label: "Project",
    flexGrow: 1,
    className: cs.basicCell,
  },
  {
    dataKey: "name",
    label: "Name",
    flexGrow: 1,
    width: 200,
    className: cs.sampleNameCell,
    headerClassName: cs.sampleNameHeader,
  },
  {
    dataKey: "host",
    label: "Host",
    flexGrow: 1,
    className: cs.basicCell,
  },
  {
    dataKey: "tissue",
    label: "Sample Type",
    flexGrow: 1,
    className: cs.basicCell,
  },
  {
    dataKey: "location",
    label: "Location",
    flexGrow: 1,
    className: cs.basicCell,
  },
  {
    dataKey: "created_at",
    label: "Date",
    flexGrow: 1,
    cellRenderer: ({ cellData }) => {
      if (cellData) {
        return <Moment fromNow date={cellData} />;
      }
    },
    className: cs.basicCell,
  },
  {
    dataKey: "num_contigs",
    label: "Contigs",
    flexGrow: 1,
    className: cs.basicCell,
  },
  {
    dataKey: "coverage_breadth",
    label: "Coverage Breadth",
    flexGrow: 1,
    cellDataGetter: ({ rowData }) => {
      const numContigs = get("num_contigs", rowData);
      const coverageBreadth = get("coverage_breadth", rowData);
      const pipelineVersion = get("pipeline_version", rowData);
      const hasCoverageBreadth = isPipelineFeatureAvailable(
        ACCESSION_COVERAGE_STATS_FEATURE,
        pipelineVersion,
      );
      return hasCoverageBreadth || numContigs === 0 ? coverageBreadth : "-";
    },
    cellRenderer: ({ cellData }) => {
      if (cellData === "-") {
        return (
          <ColumnHeaderTooltip
            trigger={<div>{cellData}</div>}
            content={
              "Not shown for samples on pipeline versions older than 6.0."
            }
            position="top center"
            offset={[-1, 0]}
          />
        );
      } else {
        return formatPercent(cellData);
      }
    },
    className: cs.basicCell,
  },
];
