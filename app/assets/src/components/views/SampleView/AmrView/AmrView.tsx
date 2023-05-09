import { useReactiveVar } from "@apollo/client";
import { get } from "lodash/fp";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { getWorkflowRunResults } from "~/api";
import { withAnalytics } from "~/api/analytics";
import {
  activeAmrFiltersVar,
  amrReportTableDownloadWithAppliedFiltersLinkVar,
} from "~/cache/initialCache";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { UserContext } from "~/components/common/UserContext";
import {
  computeAmrReportTableValuesForCSV,
  createCSVObjectURL,
} from "~/components/utils/csv";
import { AMR_HELP_LINK } from "~/components/utils/documentationLinks";
import { AMR_V2_FEATURE } from "~/components/utils/features";
import { camelize, IdMap } from "~/components/utils/objectUtil";
import Sample, { WorkflowRun } from "~/interface/sample";
import SampleReportContent from "../SampleReportContent";
import { AmrFiltersContainer } from "./components/AmrFiltersContainer";
import { countActiveFilters } from "./components/AmrFiltersContainer/utils";
import AmrNullResult from "./components/AmrNullResult";
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
  const [hideFilters, setHideFilters] = useState(true);
  const [reportTableData, setReportTableData] =
    useState<IdMap<AmrResult>>(null);
  const [dataFilterFunc, setDataFilterFunc] =
    useState<(data: AmrResult[]) => IdMap<AmrResult>>();
  const [detailsSidebarGeneName, setDetailsSidebarGeneName] = useState<
    string | null
  >(null);
  const [shouldShowNullResult, setShouldShowNullResult] = useState(false);

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

  useEffect(() => {
    const loadedValidSample =
      !loadingResults && get("status", workflowRun) === "SUCCEEDED";
    const resultIsNull =
      reportTableData === null || Object.keys(reportTableData).length === 0;
    setShouldShowNullResult(loadedValidSample && resultIsNull);
  }, [loadingResults, reportTableData]);

  const activeFilterSelections = useReactiveVar(activeAmrFiltersVar);
  useEffect(() => {
    generateReportWithAppliedFiltersDownloadLink();
  }, [displayedRows]);

  const generateReportWithAppliedFiltersDownloadLink = () => {
    const numOfActiveAmrFilters = countActiveFilters(activeFilterSelections);
    if (numOfActiveAmrFilters === 0) {
      amrReportTableDownloadWithAppliedFiltersLinkVar(null);
    } else {
      const [csvHeaders, csvRows] = computeAmrReportTableValuesForCSV({
        displayedRows,
        activeFilters: activeFilterSelections,
      });

      const link = createCSVObjectURL(csvHeaders, csvRows);
      amrReportTableDownloadWithAppliedFiltersLinkVar(link);
    }
  };

  const renderResults = () => {
    if (allowedFeatures.includes(AMR_V2_FEATURE)) {
      return (
        <>
          <AmrFiltersContainer
            setDataFilterFunc={setDataFilterFunc}
            hideFilters={hideFilters}
            setHideFilters={setHideFilters}
          />
          <AmrSampleReport
            reportTableData={displayedRows}
            sample={sample}
            workflowRun={workflowRun}
            setDetailsSidebarGeneName={setDetailsSidebarGeneName}
            hideFilters={hideFilters}
          />
        </>
      );
    } else {
      return (
        <AmrOutputDownloadView workflowRun={workflowRun} sample={sample} />
      );
    }
  };

  return shouldShowNullResult ? (
    <AmrNullResult />
  ) : (
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
