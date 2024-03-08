import { getURLParamString } from "~/helpers/url";
import Sample, { WorkflowRun } from "~/interface/sample";

export const NONHOST_DOWNLOADS_TOOLTIP =
  "Download this file from Intermediate Files (.zip) for samples run before pipeline version 1.1.";

const NON_HOST_READS_LABEL = "Download Non-Host Reads (.fasta)";
const NON_HOST_CONTIGS_LABEL = "Download Non-Host Contigs (.fasta)";
const COMPREHENSIVE_AMR_METRICS_LABEL =
  "Download Comprehensive AMR Metrics File (.tsv)";
const INTERMEDIATE_FILES_LABEL = "Download Intermediate Files (.zip)";

export enum DownloadOptions {
  NON_HOST_READS_LABEL = "Download Non-Host Reads (.fasta)",
  NON_HOST_CONTIGS_LABEL = "Download Non-Host Contigs (.fasta)",
  COMPREHENSIVE_AMR_METRICS_LABEL = "Download Comprehensive AMR Metrics File (.tsv)",
  INTERMEDIATE_FILES_LABEL = "Download Intermediate Files (.zip)",
}

const generateDownloadUrl = (workflowRunId: string, downloadType: string) =>
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

export const downloadAmrGeneLevelData = (
  downloadType: string,
  indexId: string,
  geneName: string,
  workflowRunId: string,
) => {
  const params = getURLParamString({
    downloadType: downloadType,
    indexId: indexId,
    geneName: geneName,
  });
  location.href = `/workflow_runs/${workflowRunId}/amr_gene_level_downloads?${params}`;
};
