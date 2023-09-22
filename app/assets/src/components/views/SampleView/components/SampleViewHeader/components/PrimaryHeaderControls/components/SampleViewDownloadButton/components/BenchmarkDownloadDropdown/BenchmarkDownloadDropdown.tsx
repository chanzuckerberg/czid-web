import React from "react";
import { Dropdown as BaseDropdown } from "semantic-ui-react";
import { DownloadButtonDropdown } from "~/components/ui/controls/dropdowns";
import { WorkflowRun } from "~/interface/sample";
import cs from "./benchmark_download_dropdown.scss";

export interface BenchmarkDownloadDropdownProps {
  className?: string;
  readyToDownload?: boolean;
  workflowRun: WorkflowRun;
}

export const BenchmarkDownloadDropdown = ({
  className,
  readyToDownload,
  workflowRun,
}: BenchmarkDownloadDropdownProps) => {
  if (!readyToDownload) return null;
  const handleDownload = (option: string) => {
    switch (option) {
      case "download_benchmarks":
        location.href = `/workflow_runs/${workflowRun.id}/benchmark_report_downloads?downloadType=report_html`;
        break;
      case "download_notebook":
        location.href = `/workflow_runs/${workflowRun.id}/benchmark_report_downloads?downloadType=report_ipynb`;
        break;
      default:
        break;
    }
  };

  const downloadOptions = [
    {
      text: "Download Benchmarks (.html)",
      value: "download_benchmarks",
    },
    {
      text: "Download Jupyter Notebook (.ipynb)",
      value: "download_notebook",
    },
  ].map(({ text, value }) => (
    <BaseDropdown.Item
      key={value}
      onClick={() => handleDownload(value)}
      className={cs.item}
    >
      {text}
    </BaseDropdown.Item>
  ));

  return (
    <DownloadButtonDropdown
      className={className}
      items={downloadOptions}
      onClick={handleDownload}
      direction="left"
    />
  );
};
