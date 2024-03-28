import { compact } from "lodash/fp";
import { EventData, TrackEventType } from "~/api/analytics";
import { SampleId } from "~/interface/shared";

const NON_HOST_READS_LABEL = "Download Non-Host Reads (.fasta)";
const NON_HOST_CONTIGS_LABEL = "Download Non-Host Contigs (.fasta)";
const NON_HOST_CONTIGS_MAPPING_LABEL =
  "Download Non-Host Contigs Summary (.csv)";
const UNMAPPED_READS_LABEL = "Download Unmapped Reads (.fasta)";
const RESULTS_FOLDER_LABEL = "View Results Folder";
const PIPELINE_VIZ_LABEL = "View Pipeline Visualization";

// Get download options based on pipeline metadata.
const getDownloadOptions = (pipelineRun: $TSFixMe) => {
  const stageTwoComplete = pipelineRun && pipelineRun.adjusted_remaining_reads;
  const assembled = pipelineRun && pipelineRun.assembled === 1;

  return compact([
    stageTwoComplete && NON_HOST_READS_LABEL,
    assembled && NON_HOST_CONTIGS_LABEL,
    assembled && NON_HOST_CONTIGS_MAPPING_LABEL,
    stageTwoComplete && UNMAPPED_READS_LABEL,
    RESULTS_FOLDER_LABEL,
    pipelineRun.pipeline_version && PIPELINE_VIZ_LABEL,
  ]);
};

// Convert options to download options.
export const getDownloadDropdownOptions = (pipelineRun: $TSFixMe) => {
  const downloadOptions = getDownloadOptions(pipelineRun);

  return downloadOptions.map(option => ({
    text: option,
    value: option,
  }));
};

// Get a map of download option to download path and
// whether to open link in new page.
const getDownloadLinkInfoMap = (sampleId, pipelineRun) => ({
  [NON_HOST_READS_LABEL]: {
    path: `/samples/${sampleId}/nonhost_fasta?pipeline_version=${pipelineRun.pipeline_version}`,
    newPage: false,
  },

  [NON_HOST_CONTIGS_LABEL]: {
    path: `/samples/${sampleId}/contigs_fasta?pipeline_version=${pipelineRun.pipeline_version}`,
    newPage: false,
  },

  [NON_HOST_CONTIGS_MAPPING_LABEL]: {
    path: `/samples/${sampleId}/contigs_summary?pipeline_version=${pipelineRun.pipeline_version}`,
    newPage: false,
  },

  [UNMAPPED_READS_LABEL]: {
    path: `/samples/${sampleId}/unidentified_fasta?pipeline_version=${pipelineRun.pipeline_version}`,
    newPage: false,
  },

  [RESULTS_FOLDER_LABEL]: {
    path: `/samples/${sampleId}/results_folder?pipeline_version=${pipelineRun.pipeline_version}`,
    newPage: true,
  },

  [PIPELINE_VIZ_LABEL]: {
    path: `/samples/${sampleId}/pipeline_viz/${pipelineRun.pipeline_version}`,
    newPage: true,
  },
});

export const getLinkInfoForDownloadOption = (
  option: $TSFixMe,
  sampleId: $TSFixMe,
  pipelineRun: $TSFixMe,
) => getDownloadLinkInfoMap(sampleId, pipelineRun)[option];

export const getDownloadLinks = (sampleId: $TSFixMe, pipelineRun: $TSFixMe) => {
  const downloadOptions = getDownloadOptions(pipelineRun);

  const downloadLinkInfoMap = getDownloadLinkInfoMap(sampleId, pipelineRun);

  return downloadOptions.map(option => ({
    label: option,
    path: downloadLinkInfoMap[option].path,
    newPage: downloadLinkInfoMap[option].newPage,
  }));
};

export const getWorkflowRunZipLink = (workflowRunId: number) => {
  return `/workflow_runs/${workflowRunId}/zip_link`;
};

export const logDownloadOption = ({
  trackEvent,
  component,
  option,
  details = {},
}: {
  trackEvent: TrackEventType;
  component: string;
  option: string;
  details: EventData;
}) => {
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

export const getDownloadContigUrl = ({
  pipelineVersion,
  sampleId,
  taxId,
}: {
  pipelineVersion: string;
  sampleId: SampleId;
  taxId: number;
}): string => {
  return `/samples/${sampleId}/taxid_contigs_download?taxid=${taxId}&pipeline_version=${pipelineVersion}`;
};
