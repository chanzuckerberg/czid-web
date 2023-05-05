import React, { useContext, useEffect, useMemo, useState } from "react";
import { getWorkflowRunResults } from "~/api";
import { withAnalytics } from "~/api/analytics";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { UserContext } from "~/components/common/UserContext";
import { AMR_HELP_LINK } from "~/components/utils/documentationLinks";
import { AMR_V2_FEATURE } from "~/components/utils/features";
import { camelize, IdMap } from "~/components/utils/objectUtil";
import Sample, { WorkflowRun } from "~/interface/sample";
import SampleReportContent from "../SampleReportContent";
import { AmrFiltersContainer } from "./components/AmrFiltersContainer";
import { FilterType } from "./components/AmrFiltersContainer/types";
import { AmrOutputDownloadView } from "./components/AmrOutputDownloadView";
import { AmrSampleReport } from "./components/AmrSampleReport";
import { AmrResult } from "./components/AmrSampleReport/types";

interface AmrViewProps {
  workflowRun: WorkflowRun;
  sample: Sample;
}

export const AmrView = ({ workflowRun, sample }: AmrViewProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  const [loadingResults, setLoadingResults] = useState(false);
  const [reportTableData, setReportTableData] =
    useState<IdMap<AmrResult>>(null);
  const [dataFilterFunc, setDataFilterFunc] =
    useState<(data: AmrResult[]) => IdMap<AmrResult>>();
  const [, setActiveFilters] = useState<FilterType[]>([]);

  // Apply the active filters to get the rows to display
  const displayedRows = useMemo(() => {
    if (!reportTableData) return {} as IdMap<AmrResult>;
    if (!dataFilterFunc) return reportTableData;
    return dataFilterFunc(Object.values(reportTableData));
  }, [dataFilterFunc, reportTableData]);

  useEffect(() => {
    if (!allowedFeatures.includes(AMR_V2_FEATURE)) return;
    setLoadingResults(true);
    const fetchResults = async () => {
      const reportDataRaw = await getWorkflowRunResults(workflowRun.id);
      const reportData = camelize(reportDataRaw);
      setReportTableData(reportData.reportTableData);
      setLoadingResults(false);
    };

    fetchResults();
  }, []);

  const [detailsSidebarGeneName, setDetailsSidebarGeneName] = useState<
    string | null
  >(null);

  const renderResults = () => {
    if (allowedFeatures.includes(AMR_V2_FEATURE)) {
      return (
        <>
          <AmrFiltersContainer
            setActiveFilters={setActiveFilters}
            setDataFilterFunc={setDataFilterFunc}
          />
          <AmrSampleReport
            reportTableData={displayedRows}
            sample={sample}
            workflowRun={workflowRun}
            setDetailsSidebarGeneName={setDetailsSidebarGeneName}
          />
        </>
      );
    } else {
      return (
        <AmrOutputDownloadView workflowRun={workflowRun} sample={sample} />
      );
    }
  };

  return (
    <>
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
      {allowedFeatures.includes(AMR_V2_FEATURE) && (
        <DetailsSidebar
          visible={Boolean(detailsSidebarGeneName)}
          mode="geneDetails"
          onClose={() =>
            withAnalytics(
              setDetailsSidebarGeneName(null),
              "AmrView_details-sidebar_closed",
            )
          }
          params={{ geneName: detailsSidebarGeneName }}
        />
      )}
    </>
  );
};
