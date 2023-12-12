import { Button, Icon } from "@czi-sds/components";
import { cx } from "@emotion/css";
import React from "react";
import { graphql, useFragment } from "react-relay";
import BasicPopup from "~/components/BasicPopup";
import { HelpIcon } from "~/components/ui/containers";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { formatPercent } from "~/components/utils/format";
import { openUrlInNewTab } from "~/components/utils/links";
import { FIELDS_METADATA } from "~/components/utils/tooltip";
import { getWorkflowRefAccessionFileLink } from "~/components/views/report/utils/download";
import cs from "~/components/views/SampleView/components/ConsensusGenomeView/consensus_genome_view.scss";
import { WorkflowRun } from "~/interface/sample";
import { SampleId } from "~/interface/shared";
import { ConsensusGenomeReportQuery$data } from "../../__generated__/ConsensusGenomeReportQuery.graphql";
import { ConsensusGenomeCoverageViewFragment$key } from "./__generated__/ConsensusGenomeCoverageViewFragment.graphql";
import { ConsensusGenomeHistogram } from "./components/ConsensusGenomeHistogram";

export const ConsensusGenomeCoverageViewFragment = graphql`
  fragment ConsensusGenomeCoverageViewFragment on ConsensusGenomeWorkflowResults {
    reference_genome {
      accession_id
      taxon {
        name
        id
      }
    }
    metric_consensus_genome {
      coverage_viz {
        coverage_breadth
        coverage_depth
        total_length
      }
    }
  }
`;
interface ConsensusGenomeCoverageViewProps {
  helpLinkUrl: string;
  sampleId: SampleId;
  workflowRun: WorkflowRun;
  workflowRunResultsData: NonNullable<
    ConsensusGenomeReportQuery$data["ConsensusGenomeWorkflowResults"]
  >;
}

export const ConsensusGenomeCoverageView = ({
  helpLinkUrl,
  sampleId,
  workflowRun,
  workflowRunResultsData,
}: ConsensusGenomeCoverageViewProps) => {
  const data = useFragment<ConsensusGenomeCoverageViewFragment$key>(
    ConsensusGenomeCoverageViewFragment,
    workflowRunResultsData,
  );
  const {
    reference_genome: referenceGenome,
    metric_consensus_genome: metricConsensusGenome,
  } = data || {};
  const { accession_id: accessionId, taxon } = referenceGenome || {};
  const { name: taxonName, id: taxonId } = taxon || {};
  const {
    coverage_breadth: coverageBreadthRaw,
    coverage_depth: coverageDepthRaw,
    total_length: totalLength,
  } = metricConsensusGenome?.coverage_viz || {};

  if (!coverageBreadthRaw || !coverageDepthRaw || !totalLength) {
    return null;
  }

  const referenceNCBIEntry = (
    <BasicPopup
      trigger={
        <div className={cs.ncbiLinkWrapper}>
          <ExternalLink
            href={`https://www.ncbi.nlm.nih.gov/nuccore/${accessionId}?report=genbank`}
            analyticsEventName={"ConsensusGenomeView_ncbi-link_clicked"}
            analyticsEventData={{
              accessionId,
              taxonId,
              sampleId,
            }}
          >
            {accessionId}
          </ExternalLink>
        </div>
      }
      inverted={false}
      content={taxonName}
    />
  );

  const downloadCustomRefFile = () => {
    const fileLocation = getWorkflowRefAccessionFileLink(workflowRun.id);
    openUrlInNewTab(fileLocation);
  };

  const customReference = (
    <Button
      sdsType="secondary"
      sdsStyle="minimal"
      isAllCaps
      onClick={downloadCustomRefFile}
      className={cs.customReference}
    >
      <Icon sdsIcon="download" sdsSize="xs" sdsType="button" />
      <span className={cs.downloadLink}>Download</span>
    </Button>
  );

  const metrics = {
    ...(accessionId ? { referenceNCBIEntry } : { customReference }),
    referenceLength: totalLength,
    coverageDepth: `${coverageDepthRaw.toFixed(1)}x`,
    coverageBreadth: formatPercent(coverageBreadthRaw),
  };

  const CG_VIEW_METRIC_COLUMNS = [
    accessionId ? "referenceNCBIEntry" : "customReference",
    "referenceLength",
    "coverageDepth",
    "coverageBreadth",
  ].map(key => [
    {
      key,
      ...FIELDS_METADATA[key],
    },
  ]);

  return (
    <div className={cs.section}>
      <div className={cs.title}>
        How good is the coverage?
        <HelpIcon
          className={cx(cs.helpIcon, cs.lower)}
          text="These metrics and chart help determine the coverage of the reference accession."
          learnMoreLinkUrl={helpLinkUrl}
          learnMoreLinkAnalyticsEventName="ConsensusGenomeView_help-link_clicked"
        />
      </div>
      <div className={cx(cs.coverageContainer, cs.raisedContainer)}>
        <div className={cs.metrics}>
          {CG_VIEW_METRIC_COLUMNS.map((col, index) => (
            <div className={cs.column} key={index}>
              {col.map(metric => (
                <div className={cs.metric} key={metric.key}>
                  <div className={cs.label}>
                    <BasicPopup
                      trigger={<div>{metric.label}</div>}
                      inverted={false}
                      content={metric.tooltip}
                    />
                  </div>
                  <div className={cs.value}>{metrics[metric.key]}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <ConsensusGenomeHistogram
          workflowRun={workflowRun}
          workflowRunResultsData={workflowRunResultsData}
        />
      </div>
    </div>
  );
};
