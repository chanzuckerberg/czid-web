import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { Table } from "~/components/ui/Table";
import { IdMap } from "~/components/utils/objectUtil";
import Sample, { WorkflowRun } from "~/interface/sample";
import cs from "./amr_sample_report.scss";
import {
  contigPercentCoverageColumn,
  contigPercentIdColumn,
  contigsColumn,
  cutoffColumn,
  geneColumn,
} from "./columnDefinitions";
import { AmrResult } from "./types";

interface AmrSampleReportProps {
  reportTableData: IdMap<AmrResult>;
  sample: Sample;
  workflowRun: WorkflowRun;
}

export const AmrSampleReport = ({ reportTableData }: AmrSampleReportProps) => {
  // This file will include state representing visible rows/columns
  // The headers
  // The table
  // The filters to change the visible rows
  // The dropdown to change the visible columns

  // Add new columns to the columns directory and then add them to this list
  // We will need to modify for hiding/showing columns in the future.
  const columns: ColumnDef<AmrResult, any>[] = [
    geneColumn,
    contigsColumn,
    cutoffColumn,
    contigPercentCoverageColumn,
    contigPercentIdColumn,
  ];

  return (
    <>
      <div className={cs.reportWrapper}>
        <div className={cs.rowCount}>{`${
          !!reportTableData && Object.keys(reportTableData).length
        } Rows`}</div>
        <Table<AmrResult>
          columns={columns}
          initialSortKey="gene"
          isInitialSortDescending={false}
          tableData={reportTableData}
          uniqueIdentifier="gene"
        />
      </div>
    </>
  );
};
