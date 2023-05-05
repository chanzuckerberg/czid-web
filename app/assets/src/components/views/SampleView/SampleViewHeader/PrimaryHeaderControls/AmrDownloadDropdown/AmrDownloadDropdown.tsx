import { useReactiveVar } from "@apollo/client";
import React from "react";
import { amrReportTableDownloadWithAppliedFiltersLinkVar } from "~/cache/initialCache";
import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import { triggerFileDownload } from "~/components/utils/clientDownload";
import { logError } from "~/components/utils/logUtil";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  getAmrDownloadDropdownOptions,
  getAmrDownloadLink,
  logDownloadOption,
} from "./amrDownloadUtils";

interface AmrDownloadDropdownProps {
  backgroundId?: number;
  className?: string;
  currentTab?: string;
  workflowRun?: WorkflowRun;
  sample?: Sample;
  view?: string;
}

const AmrDownloadDropdown = ({
  className,
  workflowRun,
  sample,
}: AmrDownloadDropdownProps) => {
  const amrReportTableDownloadWithAppliedFiltersLink = useReactiveVar(
    amrReportTableDownloadWithAppliedFiltersLinkVar,
  );

  const downloadCSV = () => {
    location.href = `/workflow_runs/${workflowRun.id}/amr_report_downloads?downloadType=report_csv`;
  };

  const handleDownload = (option: $TSFixMe) => {
    switch (option) {
      case "download_csv":
        downloadCSV();
        break;
      case "download_csv_with_filters":
        triggerFileDownload({
          downloadUrl: amrReportTableDownloadWithAppliedFiltersLink,
          fileName: `${sample.name}_amr_report_with_applied_filters.csv`,
        });
        break;
      default: {
        const {
          downloadUrl,
          fileName,
        }: { downloadUrl: string; fileName: string } = getAmrDownloadLink(
          workflowRun,
          sample,
          option,
        );

        if (downloadUrl && fileName) {
          triggerFileDownload({ downloadUrl, fileName });
        } else {
          logError({
            message:
              "SampleViewControls/AmrDownloadDropdown: Invalid option passed to handleDownload",
            details: { option },
          });
        }
        break;
      }
    }

    logDownloadOption({
      component: "SampleViewControls/AmrDownloadDropdown",
      option,
      details: {
        sampleId: sample.id,
        sampleName: sample.name,
      },
    });
  };

  const downloadOptions = [
    {
      text: "Download Report Table (.csv)",
      value: "download_csv",
    },
    {
      text: "Download Report Table with Applied Filters (.csv)",
      value: "download_csv_with_filters",
      disabled: !amrReportTableDownloadWithAppliedFiltersLink,
    },
    ...getAmrDownloadDropdownOptions(), // other four downloads
  ];

  return (
    <DownloadButtonDropdown
      className={className}
      options={downloadOptions}
      onClick={handleDownload}
      direction="left"
    />
  );
};

export default AmrDownloadDropdown;
