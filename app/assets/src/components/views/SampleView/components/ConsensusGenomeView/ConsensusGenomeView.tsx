import cx from "classnames";
import { find, isEmpty, size } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { getWorkflowRunResults } from "~/api";
import { WorkflowType } from "~/components/utils/workflows";
import cs from "~/components/views/SampleView/components/ConsensusGenomeView/consensus_genome_view.scss";
import { SampleReportContent } from "~/components/views/SampleView/components/SampleReportConent";
import {
  RUNNING_STATE,
  SARS_COV_2_ACCESSION_ID,
  SUCCEEDED_STATE,
} from "~/components/views/SampleView/utils";
import Sample, { WorkflowRun } from "~/interface/sample";
import { ConsensusGenomeWorkflowRunResults } from "~/interface/sampleView";
import ExternalLink from "~ui/controls/ExternalLink";
import { IconArrowRight } from "~ui/icons";
import {
  SARS_COV_2_CONSENSUS_GENOME_DOC_LINK,
  VIRAL_CONSENSUS_GENOME_DOC_LINK,
} from "~utils/documentationLinks";
import { ConsensusGenomeCoverageView } from "./components/ConsensusGenomeCoverageView";
import { ConsensusGenomeDropdown } from "./components/ConsensusGenomeDropdown";
import { ConsensusGenomeMetricsTable } from "./components/ConsensusGenomeMetricsTable";

interface ConsensusGenomeViewProps {
  link?: string;
  loadingResults?: boolean;
  onWorkflowRunSelect?: $TSFixMeFunction;
  sample: Sample;
  test?: string;
  workflowRun?: WorkflowRun;
}

export const ConsensusGenomeView = ({
  onWorkflowRunSelect,
  sample,
  workflowRun,
}: ConsensusGenomeViewProps) => {
  const [loadingResults, setLoadingResults] = useState(false);
  const [workflowRunResults, setWorkflowRunResults] =
    useState<ConsensusGenomeWorkflowRunResults | null>(null);

  const consensusGenomeWorkflowRuns = sample.workflow_runs.filter(
    run => run.workflow === WorkflowType.CONSENSUS_GENOME,
  );

  const helpLinkUrl =
    workflowRun?.inputs?.accession_id === SARS_COV_2_ACCESSION_ID
      ? SARS_COV_2_CONSENSUS_GENOME_DOC_LINK
      : VIRAL_CONSENSUS_GENOME_DOC_LINK;

  // Fetching data
  useEffect(() => {
    if (
      workflowRun?.status !== SUCCEEDED_STATE ||
      workflowRun?.workflow !== WorkflowType.CONSENSUS_GENOME
    ) {
      return;
    }
    setLoadingResults(true);
    setWorkflowRunResults(null);

    const fetchResults = async () => {
      const results =
        workflowRun?.status === SUCCEEDED_STATE
          ? await getWorkflowRunResults(workflowRun?.id)
          : {};
      setWorkflowRunResults(results as ConsensusGenomeWorkflowRunResults);
      setLoadingResults(false);
    };

    fetchResults();
  }, [workflowRun?.id, workflowRun?.status, workflowRun?.workflow]);

  const shouldRenderCGDropdown = size(consensusGenomeWorkflowRuns) > 1;

  return (
    <>
      <div
        className={cx(
          cs.headerContainer,
          !shouldRenderCGDropdown && cs.removeBottomMargin,
        )}
      >
        {shouldRenderCGDropdown && (
          <div className={cs.dropdownContainer}>
            <ConsensusGenomeDropdown
              workflowRuns={consensusGenomeWorkflowRuns}
              initialSelectedValue={workflowRun?.id}
              onConsensusGenomeSelection={workflowRunId =>
                onWorkflowRunSelect(
                  find({ id: workflowRunId }, consensusGenomeWorkflowRuns),
                )
              }
            />
          </div>
        )}
        {workflowRun?.status !== RUNNING_STATE && (
          <ExternalLink
            className={cx(
              cs.learnMoreLink,
              !shouldRenderCGDropdown && cs.alignRight,
            )}
            href={helpLinkUrl}
            analyticsEventName={"ConsensusGenomeView_learn-more-link_clicked"}
          >
            Learn more about consensus genomes <IconArrowRight />
          </ExternalLink>
        )}
      </div>
      <SampleReportContent
        sample={sample}
        workflowRun={workflowRun}
        loadingResults={loadingResults}
        loadingInfo={{
          linkText: "Learn about Consensus Genomes",
          message: "Your Consensus Genome is being generated!",
          helpLink: helpLinkUrl,
        }}
        eventNames={{
          error: "ConsensusGenomeView_sample-error-info-link_clicked",
          loading: "ConsensusGenomeView_consenus-genome-doc-link_clicked",
        }}
      >
        <div className={cs.resultsContainer}>
          {workflowRunResults &&
            !isEmpty(workflowRunResults.quality_metrics) && (
              <ConsensusGenomeMetricsTable
                helpLinkUrl={helpLinkUrl}
                workflowRunResults={workflowRunResults}
              />
            )}
          {workflowRunResults && !isEmpty(workflowRunResults.coverage_viz) && (
            <ConsensusGenomeCoverageView
              helpLinkUrl={helpLinkUrl}
              sampleId={sample.id}
              workflowRun={workflowRun}
              workflowRunResults={workflowRunResults}
            />
          )}
        </div>
      </SampleReportContent>
    </>
  );
};
