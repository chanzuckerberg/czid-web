import { cx } from "@emotion/css";
import { camelCase } from "lodash/fp";
import React, { useCallback } from "react";
import { HelpIcon } from "~/components/ui/containers";
import { FIELDS_METADATA } from "~/components/utils/tooltip";
import cs from "~/components/views/SampleView/components/ConsensusGenomeView/consensus_genome_view.scss";
import { Table } from "~/components/visualizations/table";
import { ConsensusGenomeWorkflowRunResults } from "~/interface/sampleView";

interface ConsensusGenomeMetricsTableProps {
  helpLinkUrl: string;
  workflowRunResults: ConsensusGenomeWorkflowRunResults;
}

export const ConsensusGenomeMetricsTable = ({
  helpLinkUrl,
  workflowRunResults,
}: ConsensusGenomeMetricsTableProps) => {
  const computeQualityMetricColumns = useCallback(() => {
    const renderRowCell = (
      { cellData }: $TSFixMe,
      options: { percent?: $TSFixMeUnknown } = {},
    ) => (
      <div className={cs.cell}>
        {cellData}
        {options && options.percent ? "%" : null}
      </div>
    );
    const columns = [
      {
        className: cs.taxonName,
        dataKey: "taxon_name",
        headerClassName: cs.primaryHeader,
        label: "Taxon",
        width: 320,
      },
      {
        dataKey: "mapped_reads",
        width: 80,
      },
      {
        cellRenderer: (cellData: $TSFixMe) =>
          renderRowCell(cellData, { percent: true }),
        dataKey: "gc_percent",
        width: 60,
      },
      {
        dataKey: "ref_snps",
        width: 20,
      },
      {
        cellRenderer: (cellData: $TSFixMe) =>
          renderRowCell(cellData, { percent: true }),
        dataKey: "percent_identity",
        width: 30,
      },
      {
        dataKey: "n_actg",
        width: 135,
      },
      {
        cellRenderer: (cellData: $TSFixMe) =>
          renderRowCell(cellData, { percent: true }),
        dataKey: "percent_genome_called",
        width: 100,
      },
      {
        dataKey: "n_missing",
        width: 75,
      },
      {
        dataKey: "n_ambiguous",
        width: 100,
      },
    ];

    for (const col of columns) {
      if (!col["cellRenderer"]) {
        // @ts-expect-error CZID-8698 enable strictNullChecks: error TS2322
        col["cellRenderer"] = renderRowCell;
      }
      col["flexGrow"] = 1;

      // TODO: Convert to send in camelCase from the backend.
      const key = camelCase(col["dataKey"]);
      if (key in FIELDS_METADATA) {
        col["columnData"] = FIELDS_METADATA[key];
        col["label"] = FIELDS_METADATA[key].label;
      }
    }
    return columns;
  }, []);

  const metricsData = {
    taxon_name: workflowRunResults.taxon_info.taxon_name,
    ...workflowRunResults.quality_metrics,
  };

  return (
    <div className={cs.section}>
      <div className={cs.title}>
        Is my consensus genome complete?
        <HelpIcon
          text="These metrics help determine the quality of the reference accession."
          learnMoreLinkUrl={helpLinkUrl}
          analyticsEventName={
            "ConsensusGenomeView_quality-metrics-help-icon_hovered"
          }
          learnMoreLinkAnalyticsEventName="ConsensusGenomeView_help-link_clicked"
          className={cx(cs.helpIcon, cs.lower)}
        />
      </div>
      <div className={cx(cs.metricsTable, cs.raisedContainer)}>
        <Table
          columns={computeQualityMetricColumns()}
          data={[metricsData]}
          defaultRowHeight={55}
          gridClassName={cs.tableGrid}
          headerClassName={cs.tableHeader}
          headerRowClassName={cs.tableHeaderRow}
          headerHeight={25}
          headerLabelClassName={cs.tableHeaderLabel}
          rowClassName={cs.tableRow}
        />
      </div>
    </div>
  );
};
