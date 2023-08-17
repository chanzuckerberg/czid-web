import React, { useEffect, useState } from "react";
import { getWorkflowRunResults } from "~/api";
import Sample, { WorkflowRun } from "~/interface/sample";
import { SUCCEEDED_STATE } from "../../utils";
import { SampleReportContent } from "../SampleReportConent";

interface BenchmarkViewProps {
  sample: Sample;
  workflowRun: WorkflowRun;
}

export interface BenchmarkWorkflowRunResults {
  benchmark_html_report: string;
  benchmark_info: object;
  benchmark_metrics: object;
  additonal_info: object;
}

export const BenchmarkView = ({ sample, workflowRun }: BenchmarkViewProps) => {
  const [loadingResults, setLoadingResults] = useState(false);
  const [htmlReport, setHtmlReport] = useState(null);

  useEffect(() => {
    if (workflowRun?.status !== SUCCEEDED_STATE) {
      return;
    }

    const fetchResults = async () => {
      setLoadingResults(true);
      const { benchmark_html_report: htmlReport } =
        (await getWorkflowRunResults(
          workflowRun.id,
        )) as BenchmarkWorkflowRunResults;
      setHtmlReport(htmlReport);
      setLoadingResults(false);
    };

    fetchResults();
  }, []);

  const renderResults = () => {
    return (
      <div
        // HTML is outputted by Jupyter in benchmarking WDL and is safe to render
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: htmlReport }}
      />
    );
  };

  return (
    <SampleReportContent
      renderResults={renderResults}
      loadingResults={loadingResults}
      workflowRun={workflowRun}
      sample={sample}
      loadingInfo={{
        message: "Your benchmarking results are being generated!",
      }}
    />
  );
};
