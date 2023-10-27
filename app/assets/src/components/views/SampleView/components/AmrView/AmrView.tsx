import { useReactiveVar } from "@apollo/client";
import { forEach, trim } from "lodash/fp";
import React, { useEffect, useMemo, useState } from "react";
import { getWorkflowRunResults } from "~/api";
import {
  activeAmrFiltersVar,
  amrDrugClassesVar,
  amrReportTableDownloadWithAppliedFiltersLinkVar,
} from "~/cache/initialCache";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { IconLoading } from "~/components/ui/icons";
import {
  computeAmrReportTableValuesForCSV,
  createCSVObjectURL,
} from "~/components/utils/csv";
import { AMR_HELP_LINK } from "~/components/utils/documentationLinks";
import { camelize, IdMap } from "~/components/utils/objectUtil";
import { WorkflowType } from "~/components/utils/workflows";
import { SampleMessage } from "~/components/views/components/SampleMessage";
import { SampleReportContent } from "~/components/views/SampleView/components/SampleReportConent";
import csIcon from "~/components/views/SampleView/components/SampleReportConent/sample_report_content.scss";
import { SUCCEEDED_STATE } from "~/components/views/SampleView/utils";
import Sample, { SampleStatus, WorkflowRun } from "~/interface/sample";
import cs from "./amr_view.scss";
import { AmrFiltersContainer } from "./components/AmrFiltersContainer";
import { countActiveFilters } from "./components/AmrFiltersContainer/utils";
import AmrNullResult from "./components/AmrNullResult";
import { AmrSampleReport } from "./components/AmrSampleReport";
import { AmrResult } from "./components/AmrSampleReport/types";

interface AmrViewProps {
  workflowRun: WorkflowRun | null;
  sample: Sample | null;
}

export const AmrView = ({ workflowRun, sample }: AmrViewProps) => {
  const [loadingResults, setLoadingResults] = useState(false);
  const [hideFilters, setHideFilters] = useState(true);
  const [reportTableData, setReportTableData] =
    useState<IdMap<AmrResult> | null>(null);
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

  const isValidNullResult = (reportTableData: IdMap<AmrResult>) => {
    return (
      reportTableData === null || Object.keys(reportTableData).length === 0
    );
  };

  useEffect(() => {
    if (
      workflowRun?.status !== SUCCEEDED_STATE ||
      workflowRun?.workflow !== WorkflowType.AMR
    ) {
      return;
    }
    setLoadingResults(true);

    const fetchResults = async () => {
      const reportDataRaw = await getWorkflowRunResults(workflowRun?.id);
      const reportData = camelize(reportDataRaw);
      setReportTableData(reportData?.reportTableData);
      setDrugClassesReactiveVar(reportData?.reportTableData);
      setShouldShowNullResult(isValidNullResult(reportData?.reportTableData));
      setLoadingResults(false);
    };

    fetchResults();
  }, [workflowRun?.id, workflowRun?.status, workflowRun?.workflow]);

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

  if (sample && shouldShowNullResult) {
    return <AmrNullResult />;
  } else if (sample) {
    return (
      <>
        <SampleReportContent
          loadingResults={loadingResults}
          workflowRun={workflowRun}
          sample={sample}
          loadingInfo={{
            message:
              "Your antimicrobial resistance results are being generated!",
            linkText: "Learn More about our antimicrobial resistance pipeline",
            helpLink: AMR_HELP_LINK,
          }}
          eventNames={{
            error: "AmrView_sample-error-info-link_clicked",
            loading: "AmrView_amr-doc-link_clicked",
          }}
        >
          {workflowRun && (
            <>
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
            </>
          )}
        </SampleReportContent>
        <DetailsSidebar
          visible={Boolean(detailsSidebarGeneName)}
          mode="geneDetails"
          onClose={() => setDetailsSidebarGeneName(null)}
          params={{ geneName: detailsSidebarGeneName }}
        />
      </>
    );
  } else {
    return (
      <SampleMessage
        icon={<IconLoading className={csIcon.icon} />}
        message={"Loading report data."}
        status={SampleStatus.LOADING}
        type={"inProgress"}
      />
    );
  }
};
