import { cx } from "@emotion/css";
import { camelCase } from "lodash/fp";
import React, { useCallback } from "react";
import { graphql, useFragment } from "react-relay";
import { HelpIcon } from "~/components/ui/containers";
import { FIELDS_METADATA } from "~/components/utils/tooltip";
import cs from "~/components/views/SampleView/components/ConsensusGenomeView/consensus_genome_view.scss";
import { Table } from "~/components/visualizations/table";
import { ConsensusGenomeMetricsTableFragment$key } from "./__generated__/ConsensusGenomeMetricsTableFragment.graphql";
export const ConsensusGenomeMetricsTableFragment = graphql`
  fragment ConsensusGenomeMetricsTableFragment on query_fedConsensusGenomes_items
  @relay(plural: true) {
    taxon {
      commonName
    }
    metrics {
      mappedReads
      nActg
      nAmbiguous
      nMissing
      refSnps
      percentIdentity
      gcPercent
      percentGenomeCalled
    }
  }
`;
interface ConsensusGenomeMetricsTableProps {
  helpLinkUrl: string;
  workflowRunResultsData: ConsensusGenomeMetricsTableFragment$key;
}

export const ConsensusGenomeMetricsTable = ({
  helpLinkUrl,
  workflowRunResultsData,
}: ConsensusGenomeMetricsTableProps) => {
  const data = useFragment<ConsensusGenomeMetricsTableFragment$key>(
    ConsensusGenomeMetricsTableFragment,
    workflowRunResultsData,
  );
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

  if (!data) {
    return null;
  }

  const metricsData = {
    taxonName: data[0]?.taxon?.commonName,
    ...data[0]?.metrics,
  };

  // This is a note to future developers.
  // If you are seeing a blank screen here, it is likely because we only save the metric_consensus_genome data 6 months on staging/local.
  if (metricsData.taxonName && !metricsData.percentIdentity) {
    console.warn(
      "You may be seeing a blank screen here because of the data retention policy on staging. Try looking at a more recently run workflow.",
    );
    return null;
  }

  return (
    <div className={cs.section}>
      <div className={cs.title}>
        Is my consensus genome complete?
        <HelpIcon
          text="These metrics help determine the quality of the reference accession."
          learnMoreLinkUrl={helpLinkUrl}
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
