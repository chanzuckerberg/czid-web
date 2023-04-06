import React, { useContext, useEffect, useState } from "react";
import { getWorkflowRunResults } from "~/api";
import { UserContext } from "~/components/common/UserContext";
import { AMR_HELP_LINK } from "~/components/utils/documentationLinks";
import { AMR_V2_FEATURE } from "~/components/utils/features";
import { camelize } from "~/components/utils/objectUtil";
import Sample, { WorkflowRun } from "~/interface/sample";
import SampleReportContent from "../SampleReportContent";
import { AmrOutputDownloadView } from "./components/AmrOutputDownloadView";
import { AmrSampleReport } from "./components/AmrSampleReport";

interface AmrViewProps {
  workflowRun: WorkflowRun;
  sample: Sample;
}

export const AmrView = ({ workflowRun, sample }: AmrViewProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  const [loadingResults, setLoadingResults] = useState(false);
  const [reportTableData, setReportTableData] = useState(null);

  useEffect(() => {
    if (!allowedFeatures.includes(AMR_V2_FEATURE)) return;
    setLoadingResults(true);
    const fetchResults = async () => {
      // some of the below code is commented out to avoid linter errors
      // API call is still made to get the report data for future development
      const reportDataRaw = await getWorkflowRunResults(workflowRun.id);
      const reportData = camelize(reportDataRaw);
      setReportTableData(reportData.reportTableData);
      setLoadingResults(false);
    };

    fetchResults();
  }, []);

  const renderResults = () => {
    if (allowedFeatures.includes(AMR_V2_FEATURE)) {
      return (
        <AmrSampleReport
          reportTableData={reportTableData}
          sample={sample}
          workflowRun={workflowRun}
        />
      );
    } else {
      return (
        <AmrOutputDownloadView workflowRun={workflowRun} sample={sample} />
      );
    }
  };

  return (
    <SampleReportContent
      renderResults={renderResults}
      loadingResults={loadingResults}
      workflowRun={workflowRun}
      sample={sample}
      loadingInfo={{
        message: "Your antimicrobial resistance results are being generated!",
        linkText: "Learn More about our antimicrobial resistance pipeline",
        helpLink: AMR_HELP_LINK,
      }}
      eventNames={{
        error: "AmrView_sample-error-info-link_clicked",
        loading: "AmrView_amr-doc-link_clicked",
      }}
    />
  );
};
