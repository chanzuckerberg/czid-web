import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { Table } from "~/components/ui/Table";
import { IdMap } from "~/components/utils/objectUtil";
import { BenchmarkWorkflowRunAdditionalInfoEntry } from "~/interface/sampleView";
import { StyledTableRow } from "../../../AmrView/components/AmrSampleReport/components/StyledTableRow";
import { benchmarkInfoColumnGroup } from "../benchmarkInfoColumnGroup";
import cs from "./benchmark_sample_report_info.scss";
import { ncbiIndexColumn } from "./columnDefinitions/ncbiIndexColumn";
import { pipelineIdColumn } from "./columnDefinitions/pipelineIdColumn";
import { pipelineVersionColumn } from "./columnDefinitions/pipelineVersionColumn";
import { refColumn } from "./columnDefinitions/refColumn";
import { sampleNameColumn } from "./columnDefinitions/sampleNameColumn";

interface BenchmarkSampleReportInfoProps {
  info: IdMap<BenchmarkWorkflowRunAdditionalInfoEntry>;
}

export const BenchmarkSampleReportInfo = ({
  info,
}: BenchmarkSampleReportInfoProps) => {
  const columns: ColumnDef<BenchmarkWorkflowRunAdditionalInfoEntry, any>[] =
    useMemo<ColumnDef<BenchmarkWorkflowRunAdditionalInfoEntry>[]>(
      () => [
        benchmarkInfoColumnGroup(
          [
            sampleNameColumn,
            ncbiIndexColumn,
            pipelineVersionColumn,
            pipelineIdColumn,
            refColumn,
          ],
          !!info && Object.keys(info).length,
        ),
      ],
      [info],
    );

  return (
    <div className={cs.reportWrapper}>
      <div className={cs.tableWrapper}>
        <Table<BenchmarkWorkflowRunAdditionalInfoEntry>
          columns={columns}
          tableData={info}
          tableRowComponent={StyledTableRow}
          initialVisibilityState={{ columnVisibility: {} }}
          uniqueIdentifier="sampleName"
          virtuosoClassname={cs.virtuosoOverride}
        />
      </div>
    </div>
  );
};
