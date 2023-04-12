import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { Table } from "~/components/ui/Table";
import { IdMap } from "~/components/utils/objectUtil";
import Sample, { WorkflowRun } from "~/interface/sample";
import cs from "./amr_sample_report.scss";
import {
  contigPercentCoverageColumn,
  contigPercentIdColumn,
  contigsColumn,
  cutoffColumn,
  drugClassColumn,
  geneColumn,
  geneFamilyColumn,
  mechanismColumn,
  modelColumn,
} from "./columnDefinitions";
import { getContigsColumnGroup } from "./columnDefinitions/contigsColumnGroup";
import { getGeneInfoColumnGroup } from "./columnDefinitions/geneInfoColumnGroup";
import { StyledTableRow } from "./components/StyledTableRow";
import { AmrResult } from "./types";

interface AmrSampleReportProps {
  reportTableData: IdMap<AmrResult>;
  sample: Sample;
  workflowRun: WorkflowRun;
}

export const AmrSampleReport = ({ reportTableData }: AmrSampleReportProps) => {
  // This file will include state representing visible rows
  // The headers
  // The table
  // The filters to change the visible rows

  // The table component will contain the dropdown for hiding/showing columns (?)
  // The dropdown to change the visible columns

  // Add new columns to the columns directory and then add them to this list
  // We will need to modify for hiding/showing columns in the future.
  const columns: ColumnDef<AmrResult, any>[] = useMemo<ColumnDef<AmrResult>[]>(
    () => [
      getGeneInfoColumnGroup(
        [
          geneColumn,
          geneFamilyColumn,
          drugClassColumn,
          mechanismColumn,
          modelColumn,
        ],
        !!reportTableData && Object.keys(reportTableData).length,
      ),
      getContigsColumnGroup([
        cutoffColumn,
        contigsColumn,
        contigPercentCoverageColumn,
        contigPercentIdColumn,
      ]),
    ],
    [reportTableData],
  );

  return (
    <>
      <div className={cs.reportWrapper}>
        <Table<AmrResult>
          columns={columns}
          initialSortKey="gene"
          isInitialSortDescending={false}
          tableData={reportTableData}
          tableRowComponent={StyledTableRow}
          uniqueIdentifier="gene"
        />
      </div>
    </>
  );
};
