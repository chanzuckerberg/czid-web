import { Button, Icon } from "@czi-sds/components";
import { cx } from "@emotion/css";
import React from "react";
import { graphql, useFragment } from "react-relay";
import { FragmentRefs } from "relay-runtime";
import BasicPopup from "~/components/common/BasicPopup";
import { HelpIcon } from "~/components/ui/containers";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { formatPercent } from "~/components/utils/format";
import { openUrlInNewTab } from "~/components/utils/links";
import { FIELDS_METADATA } from "~/components/utils/tooltip";
import cs from "~/components/views/SampleView/components/ConsensusGenomeView/consensus_genome_view.scss";
import { WorkflowRun } from "~/interface/sample";
import { SampleId } from "~/interface/shared";
import { ConsensusGenomeHistogram } from "./components/ConsensusGenomeHistogram";
import { ConsensusGenomeCoverageViewFragment$key } from "./__generated__/ConsensusGenomeCoverageViewFragment.graphql";

export const ConsensusGenomeCoverageViewFragment = graphql`
  fragment ConsensusGenomeCoverageViewFragment on query_fedConsensusGenomes_items
  @relay(plural: true) {
    accession {
      accessionId
    }
    taxon {
      name
      id
    }
    metrics {
      coverageBreadth
      coverageDepth
      coverageTotalLength
    }
    referenceGenome {
      file {
        downloadLink {
          url
        }
      }
    }
  }
`;
interface ConsensusGenomeCoverageViewProps {
  helpLinkUrl: string;
  sampleId: SampleId;
  workflowRun: WorkflowRun;
  workflowRunResultsData: ReadonlyArray<{
    readonly " $fragmentSpreads": FragmentRefs<
      | "ConsensusGenomeCoverageViewFragment"
      | "ConsensusGenomeHistogramFragment"
      | "ConsensusGenomeMetricsTableFragment"
    >;
  }>;
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

  if (!data) {
    return null;
  }

  const accessionId = data[0]?.accession?.accessionId;
  const taxon = data[0]?.taxon;

  const { name: taxonName, id: taxonId } = taxon || {};
  const {
    coverageBreadth: coverageBreadthRaw,
    coverageDepth: coverageDepthRaw,
    coverageTotalLength: totalLength,
  } = data[0]?.metrics || {};

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
    const fileLocation = data[0]?.referenceGenome?.file?.downloadLink?.url;
    // eslint-disable-next-line no-console
    console.log({ fileLocation });
    fileLocation && openUrlInNewTab(fileLocation);
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
