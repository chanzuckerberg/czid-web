import { useReactiveVar } from "@apollo/client";
import { forEach, trim } from "lodash/fp";
import React, { useEffect, useMemo, useState } from "react";
import { getWorkflowRunResults } from "~/api";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import {
  activeAmrFiltersVar,
  amrDrugClassesVar,
  amrReportTableDownloadWithAppliedFiltersLinkVar,
} from "~/cache/initialCache";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import {
  computeAmrReportTableValuesForCSV,
  createCSVObjectURL,
} from "~/components/utils/csv";
import { AMR_HELP_LINK } from "~/components/utils/documentationLinks";
import { camelize, IdMap } from "~/components/utils/objectUtil";
import { WorkflowType } from "~/components/utils/workflows";
import { SampleReportContent } from "~/components/views/SampleView/components/SampleReportConent";
import { SUCCEEDED_STATE } from "~/components/views/SampleView/utils";
import Sample, { WorkflowRun } from "~/interface/sample";
import cs from "./amr_view.scss";
import { AmrFiltersContainer } from "./components/AmrFiltersContainer";
import { countActiveFilters } from "./components/AmrFiltersContainer/utils";
import AmrNullResult from "./components/AmrNullResult";
import { AmrSampleReport } from "./components/AmrSampleReport";
import { AmrResult } from "./components/AmrSampleReport/types";

interface AmrViewProps {
  workflowRun: WorkflowRun;
  sample: Sample;
}

export const AmrView = ({ workflowRun, sample }: AmrViewProps) => {
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
    if (
      workflowRun.status !== SUCCEEDED_STATE ||
      workflowRun.workflow !== WorkflowType.AMR
    ) {
      return;
    }
    setLoadingResults(true);

    const fetchResults = async () => {
      const reportDataRaw = await getWorkflowRunResults(workflowRun.id);
      const reportData = camelize(reportDataRaw);
      setReportTableData(reportData?.reportTableData);
      setDrugClassesReactiveVar(reportData?.reportTableData);
      setLoadingResults(false);
    };

    fetchResults();
  }, [workflowRun?.id, workflowRun?.status, workflowRun?.workflow]);

  useEffect(() => {
    const loadedValidSample =
      !loadingResults && workflowRun?.status === "SUCCEEDED";
    const resultIsNull =
      reportTableData === null || Object.keys(reportTableData).length === 0;
    setShouldShowNullResult(loadedValidSample && resultIsNull);
  }, [loadingResults, reportTableData, workflowRun?.status]);

  const activeFilterSelections = useReactiveVar(activeAmrFiltersVar);

  useEffect(() => {
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
    generateReportWithAppliedFiltersDownloadLink();
  }, [displayedRows, activeFilterSelections]);

  const setDrugClassesReactiveVar = reportTableData => {
    const drugClasses = new Set<string>();
    forEach((row: AmrResult) => {
      const { drugClass } = row;
      if (drugClass) {
        // A drug class can have multiple values separated by ";"
        drugClass.split(";").forEach((drugClass: string) => {
          drugClasses.add(trim(drugClass));
        });
      }
    }, reportTableData);
    amrDrugClassesVar(Array.from(drugClasses));
  };

  return shouldShowNullResult ? (
    <AmrNullResult />
  ) : (
    <>
      <SampleReportContent
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
      >
        <div className={cs.resultsContainer}>
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
        </div>
      </SampleReportContent>
      <DetailsSidebar
        visible={Boolean(detailsSidebarGeneName)}
        mode="geneDetails"
        onClose={() =>
          withAnalytics(
            setDetailsSidebarGeneName(null),
            ANALYTICS_EVENT_NAMES.AMR_VIEW_DETAILS_SIDEBAR_CLOSED,
          )
        }
        params={{ geneName: detailsSidebarGeneName }}
      />
    </>
  );
};
