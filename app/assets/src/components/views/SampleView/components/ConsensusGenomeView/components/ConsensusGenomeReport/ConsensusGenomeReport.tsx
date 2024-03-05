import React from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import cs from "~/components/views/SampleView/components/ConsensusGenomeView/consensus_genome_view.scss";
import { SampleReportContent } from "~/components/views/SampleView/components/SampleReportConent";
import Sample, { WorkflowRun } from "~/interface/sample";
import { getConsensusGenomeHelpLink } from "../../utils";
import { ConsensusGenomeReportQuery as ConsensusGenomeReportQueryType } from "./__generated__/ConsensusGenomeReportQuery.graphql";
import { ConsensusGenomeCoverageView } from "./components/ConsensusGenomeCoverageView";
import { ConsensusGenomeMetricsTable } from "./components/ConsensusGenomeMetricsTable";

const ConsensusGenomeReportQuery = graphql`
  query ConsensusGenomeReportQuery($workflowRunId: String) {
    fedConsensusGenomes(
      input: { where: { producingRunId: { _eq: $workflowRunId } } }
    ) {
      ...ConsensusGenomeMetricsTableFragment
      ...ConsensusGenomeCoverageViewFragment
      ...ConsensusGenomeHistogramFragment
    }
  }
`;
interface ConsensusGenomeReportProps {
  sample: Sample;
  workflowRun: WorkflowRun;
}

export const ConsensusGenomeReport = ({
  sample,
  workflowRun,
}: ConsensusGenomeReportProps) => {
  const data = useLazyLoadQuery<ConsensusGenomeReportQueryType>(
    ConsensusGenomeReportQuery,
    {
      workflowRunId: workflowRun?.id?.toString(),
    },
  );

  // check that there is a value in the first position of the array
  // since we are calling for only one consensus genome we only expect one response
  const allworkflowRunResultsData = data.fedConsensusGenomes;

  if (!(allworkflowRunResultsData && allworkflowRunResultsData.length)) {
    console.error("No Data to Display");
    return null;
  }
  const workflowRunResultsData = allworkflowRunResultsData[0];

  const helpLinkUrl = getConsensusGenomeHelpLink(
    workflowRun.inputs?.accession_id,
  );

  return (
    <SampleReportContent
      sample={sample}
      workflowRun={workflowRun}
      // loadingResults is false because with Relay and GraphQL we are using Suspense to handle the loading state
      // once all the Reports are using Relay and GraphQL, we can remove this prop from SampleReportContent
      loadingResults={false}
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
      {workflowRunResultsData && (
        <div className={cs.resultsContainer}>
          <ConsensusGenomeMetricsTable
            helpLinkUrl={helpLinkUrl}
            workflowRunResultsData={workflowRunResultsData[0]}
          />
          <ConsensusGenomeCoverageView
            helpLinkUrl={helpLinkUrl}
            sampleId={sample.id}
            workflowRun={workflowRun}
            workflowRunResultsData={workflowRunResultsData[0]}
          />
        </div>
      )}
    </SampleReportContent>
  );
};
