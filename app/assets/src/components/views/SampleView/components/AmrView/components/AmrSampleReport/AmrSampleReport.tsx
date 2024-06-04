import { cx } from "@emotion/css";
import { ColumnDef, Table as TableType } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { Table } from "~/components/ui/Table";
import { IdMap } from "~/components/utils/objectUtil";
import { loadState } from "~/helpers/storage";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  ColumnId,
  LOCAL_STORAGE_AMR_COLUMN_VISIBILITY_KEY,
} from "../../constants";
import cs from "./amr_sample_report.scss";
import {
  contigPercentCoverageColumn,
  contigPercentIdColumn,
  contigsColumn,
  contigSpeciesColumn,
  cutoffColumn,
  drugClassColumn,
  geneFamilyColumn,
  getContigsColumnGroup,
  getGeneColumn,
  getGeneInfoColumnGroup,
  getReadsColumnGroup,
  highLevelDrugClassColumn,
  mechanismColumn,
  modelColumn,
  readCoverageBreadthColumn,
  readCoverageDepthColumn,
  readDepthPerMillionColumn,
  readsColumn,
  readSpeciesColumn,
  readsPerMillionColumn,
} from "./columnDefinitions";
import { StyledTableRow } from "./components/StyledTableRow";
import { ToggleVisibleColumnsDropdown } from "./components/ToggleVisibleColumnsDropdown";
import { AmrResult } from "./types";

interface AmrSampleReportProps {
  reportTableData: IdMap<AmrResult>;
  sample: Sample;
  workflowRun: WorkflowRun;
  setDetailsSidebarGeneName: (geneName: string | null) => void;
  hideFilters: boolean;
}

const { columnVisibility: columnVisibilityLocalStorage } =
  loadState(localStorage, LOCAL_STORAGE_AMR_COLUMN_VISIBILITY_KEY) || {};
const initialVisibilityState = {
  columnVisibility: {
    [ColumnId.GENE_FAMILY]: false,
    [ColumnId.CONTIG_SPECIES]: false,
    [ColumnId.READ_SPECIES]: false,
    ...columnVisibilityLocalStorage,
  },
};

export const AmrSampleReport = ({
  reportTableData,
  setDetailsSidebarGeneName,
  hideFilters,
  workflowRun,
}: AmrSampleReportProps) => {
  // Keep the react-table instance in state to pass between the table component and the dropdown component
  const [table, setTable] = React.useState<TableType<AmrResult> | null>(null);
  const columns: ColumnDef<AmrResult, any>[] = useMemo<ColumnDef<AmrResult>[]>(
    () => [
      getGeneInfoColumnGroup(
        [
          getGeneColumn(
            setDetailsSidebarGeneName,
            workflowRun.id,
            workflowRun.wdl_version,
          ),
          geneFamilyColumn,
          drugClassColumn,
          highLevelDrugClassColumn,
          mechanismColumn,
          modelColumn,
        ],
        !!reportTableData && Object.keys(reportTableData).length,
      ),
      getContigsColumnGroup(
        [
          contigsColumn,
          cutoffColumn,
          contigPercentCoverageColumn,
          contigPercentIdColumn,
          contigSpeciesColumn,
        ],
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        table,
      ),
      getReadsColumnGroup(
        [
          readsColumn,
          readsPerMillionColumn,
          readCoverageBreadthColumn,
          readCoverageDepthColumn,
          readDepthPerMillionColumn,
          readSpeciesColumn,
        ],
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        table,
      ),
    ],
    [reportTableData],
  );

  return (
    <div
      data-testid="amr-sample-report"
      className={
        hideFilters
          ? cx(cs.reportWrapper, cs.reportWrapperFiltersClosed)
          : cx(cs.reportWrapper, cs.reportWrapperFiltersOpen)
      }
    >
      <div className={cs.tableWrapper}>
        <Table<AmrResult>
          columns={columns}
          initialSortKey="gene"
          initialVisibilityState={initialVisibilityState}
          isInitialSortDescending={false}
          setTableReference={setTable}
          tableData={reportTableData}
          tableRowComponent={StyledTableRow}
          uniqueIdentifier="gene"
        />
      </div>
      <div className={cs.dropdownWrapper}>
        {table && <ToggleVisibleColumnsDropdown table={table} />}
      </div>
    </div>
  );
};
