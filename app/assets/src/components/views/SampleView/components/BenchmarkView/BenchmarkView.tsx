import React, { useEffect, useState } from "react";
import { getWorkflowRunResults } from "~/api";
import { camelize } from "~/components/utils/objectUtil";
import Sample, { WorkflowRun } from "~/interface/sample";
import { SUCCEEDED_STATE } from "../../utils";
import { SampleReportContent } from "../SampleReportConent";
import { BenchmarkSampleReportInfo } from "./components/BenchmarkSampleReportInfo";

interface BenchmarkViewProps {
  sample: Sample;
  workflowRun: WorkflowRun;
}

export interface BenchmarkWorkflowRunResults {
  benchmarkHtmlReport: string;
  benchmarkInfo: object;
  benchmarkMetrics: object;
  additionalInfo: object;
}

export const BenchmarkView = ({ sample, workflowRun }: BenchmarkViewProps) => {
  const [loadingResults, setLoadingResults] = useState(false);
  const [htmlReport, setHtmlReport] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);

  useEffect(() => {
    if (workflowRun?.status !== SUCCEEDED_STATE) {
      return;
    }

    const fetchResults = async () => {
      setLoadingResults(true);
      const { benchmarkHtmlReport, additionalInfo } = camelize(
        await getWorkflowRunResults(workflowRun.id),
      ) as BenchmarkWorkflowRunResults;
      setHtmlReport(benchmarkHtmlReport);
      setAdditionalInfo(additionalInfo);
      setLoadingResults(false);
    };

    fetchResults();
  }, [workflowRun.id, workflowRun?.status]);

  return (
    <SampleReportContent
      loadingResults={loadingResults}
      workflowRun={workflowRun}
      sample={sample}
      loadingInfo={{
        message: "Your benchmarking results are being generated!",
      }}
    >
      <div>
        {additionalInfo && <BenchmarkSampleReportInfo info={additionalInfo} />}
        <div
          // HTML is outputted by Jupyter in benchmarking WDL and is safe to render
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: htmlReport }}
        />
      </div>
    </SampleReportContent>
  );
};
