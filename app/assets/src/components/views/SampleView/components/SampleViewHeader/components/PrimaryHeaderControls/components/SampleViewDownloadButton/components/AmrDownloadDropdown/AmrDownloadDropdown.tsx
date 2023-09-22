import { useReactiveVar } from "@apollo/client";
import { Tooltip } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import { Dropdown as BaseDropdown } from "semantic-ui-react";
import { amrReportTableDownloadWithAppliedFiltersLinkVar } from "~/cache/initialCache";
import DownloadButtonDropdown from "~/components/ui/controls/dropdowns/DownloadButtonDropdown";
import { triggerFileDownload } from "~/components/utils/clientDownload";
import { logError } from "~/components/utils/logUtil";
import Sample, { WorkflowRun } from "~/interface/sample";
import cs from "./amr_download_dropdown.scss";
import {
  DownloadOptions,
  getAmrDownloadLink,
  logDownloadOption,
  NONHOST_DOWNLOADS_TOOLTIP,
} from "./amrDownloadUtils";

export interface AmrDownloadDropdownProps {
  readyToDownload?: boolean;
  className?: string;
  workflowRun?: WorkflowRun;
  sample?: Sample;
}

export const AmrDownloadDropdown = ({
  readyToDownload,
  className,
  workflowRun,
  sample,
}: AmrDownloadDropdownProps) => {
  if (!readyToDownload) return null;
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

  const workflowVersion = parseFloat(workflowRun?.wdl_version ?? "0");
  const isOldPipeline = workflowVersion < 1.1;

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
    {
      text: DownloadOptions.NON_HOST_READS_LABEL,
      value: DownloadOptions.NON_HOST_READS_LABEL,
      disabled: isOldPipeline,
      tooltipText: NONHOST_DOWNLOADS_TOOLTIP,
    },
    {
      text: DownloadOptions.NON_HOST_CONTIGS_LABEL,
      value: DownloadOptions.NON_HOST_CONTIGS_LABEL,
      disabled: isOldPipeline,
      tooltipText: NONHOST_DOWNLOADS_TOOLTIP,
    },
    {
      text: DownloadOptions.COMPREHENSIVE_AMR_METRICS_LABEL,
      value: DownloadOptions.COMPREHENSIVE_AMR_METRICS_LABEL,
    },
    {
      text: DownloadOptions.INTERMEDIATE_FILES_LABEL,
      value: DownloadOptions.INTERMEDIATE_FILES_LABEL,
    },
  ];

  const getDownloadOptionItems = () => {
    const options = [];
    downloadOptions.forEach(({ text, value, disabled, tooltipText }) => {
      options.push(createDropdownOption(text, value, disabled, tooltipText));
    });
    return options;
  };

  const createDropdownOption = (
    text: string,
    value: string,
    disabled: boolean,
    tooltipText: string,
  ) => {
    let dropdownItem = (
      <BaseDropdown.Item
        key={value}
        onClick={() => handleDownload(value)}
        className={cx(cs.item, disabled && cs.disabledItem)}
        disabled={disabled}
      >
        {text}
      </BaseDropdown.Item>
    );

    if (disabled && tooltipText) {
      dropdownItem = (
        <Tooltip
          arrow
          placement="top"
          title={tooltipText}
          key={`${value}-tooltip`}
        >
          <span>{dropdownItem}</span>
        </Tooltip>
      );
    }
    return dropdownItem;
  };

  return (
    <DownloadButtonDropdown
      className={className}
      items={getDownloadOptionItems()}
      onClick={handleDownload}
      direction="left"
    />
  );
};
