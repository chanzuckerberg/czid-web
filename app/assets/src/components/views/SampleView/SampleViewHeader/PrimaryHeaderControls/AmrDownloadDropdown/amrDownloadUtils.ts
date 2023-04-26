import { trackEvent } from "~/api/analytics";
import Sample, { WorkflowRun } from "~/interface/sample";

const NON_HOST_READS_LABEL = "Download Non-Host Reads (.fasta)";
const NON_HOST_CONTIGS_LABEL = "Download Non-Host Contigs (.fasta)";
const COMPREHENSIVE_AMR_METRICS_LABEL =
  "Download Comprehensive AMR Metrics File (.tsv)";
const INTERMEDIATE_FILES_LABEL = "Download Intermediate Files (.zip)";

const downloadOptionLabels = [
  NON_HOST_READS_LABEL,
  NON_HOST_CONTIGS_LABEL,
  COMPREHENSIVE_AMR_METRICS_LABEL,
  INTERMEDIATE_FILES_LABEL,
];

const implementedDownloadOptions = [
  COMPREHENSIVE_AMR_METRICS_LABEL,
  INTERMEDIATE_FILES_LABEL,
  NON_HOST_READS_LABEL,
  NON_HOST_CONTIGS_LABEL,
];

// Convert download option labels to dropdown options.
export const getAmrDownloadDropdownOptions = (): Array<{
  text: string;
  value: string;
  disabled: boolean;
}> => {
  return downloadOptionLabels.map(option => ({
    text: option,
    value: option,
    disabled: !implementedDownloadOptions.includes(option),
  }));
};

const generateDownloadUrl = (workflowRunId: number, downloadType: string) =>
  `/workflow_runs/${workflowRunId}/amr_report_downloads?downloadType=${downloadType}`;

// Get a map of download option to download path and
// whether to open link in new page.
export const getAmrDownloadLink = (
  workflowRun: WorkflowRun,
  sample: Sample,
  option,
): { downloadUrl: string; fileName: string } => {
  let downloadUrl = "";
  let fileName = "";
  switch (option) {
    case NON_HOST_READS_LABEL:
      downloadUrl = generateDownloadUrl(workflowRun.id, "non_host_reads");
      fileName = `${sample.name}_${workflowRun.id}_non_host_reads.fasta.gz`;
      break;
    case NON_HOST_CONTIGS_LABEL:
      downloadUrl = generateDownloadUrl(workflowRun.id, "non_host_contigs");
      fileName = `${sample.name}_${workflowRun.id}_contigs.fasta`;
      break;
    case COMPREHENSIVE_AMR_METRICS_LABEL:
      downloadUrl = generateDownloadUrl(
        workflowRun.id,
        "comprehensive_amr_metrics_tsv",
      );
      fileName = `${sample.name}_${workflowRun.id}_comprehensive_amr_metrics.tsv`;
      break;
    case INTERMEDIATE_FILES_LABEL:
      downloadUrl = generateDownloadUrl(workflowRun.id, "zip_link");
      fileName = `${sample.name}_${workflowRun.id}_amr_intermediate_files.zip`;
      break;
  }
  return { downloadUrl, fileName };
};

export const logDownloadOption = ({
  component,
  option,
  details = {},
}: {
  component: string;
  option: string;
  details: $TSFixMe;
}): void => {
  trackEvent(
    // make names like:
    // SamplesHeatmapHeader_download-current-heatmap-view-csv_clicked
    `${component}-download-${option
      .replace(/\W+/g, "-")
      .replace(/_/g, "-")
      .replace("-_", "_")
      .toLowerCase()}_clicked`,
    details,
  );
};
