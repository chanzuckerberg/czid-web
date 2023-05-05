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
  contigSpeciesColumn,
  cutoffColumn,
  dropdownColumnGroup,
  drugClassColumn,
  geneColumn,
  geneFamilyColumn,
  getReadsColumnGroup,
  mechanismColumn,
  modelColumn,
  readCoverageBreadthColumn,
  readCoverageDepthColumn,
  readDepthPerMillionColumn,
  readsColumn,
  readSpeciesColumn,
  readsPerMillionColumn,
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
        contigsColumn,
        cutoffColumn,
        contigPercentCoverageColumn,
        contigPercentIdColumn,
        contigSpeciesColumn,
      ]),
      getReadsColumnGroup([
        readsColumn,
        readsPerMillionColumn,
        readCoverageBreadthColumn,
        readCoverageDepthColumn,
        readDepthPerMillionColumn,
        readSpeciesColumn,
      ]),
      dropdownColumnGroup,
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
