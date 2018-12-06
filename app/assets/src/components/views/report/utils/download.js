import { compact } from "lodash/fp";

const NON_HOST_READS_LABEL = "Download Non-Host Reads (.fasta)";
const NON_HOST_CONTIGS_LABEL = "Download Non-Host Contigs (.fasta)";
const NON_HOST_CONTIGS_MAPPING_LABEL =
  "Download Non-Host Contigs Summary (.csv)";
const UNMAPPED_READS_LABEL = "Download Unmapped Reads (.fasta)";
const RESULTS_FOLDER_LABEL = "See Results Folder";

// Get download options based on pipeline metadata.
const getDownloadOptions = pipelineRun => {
  let stageTwoComplete = pipelineRun && pipelineRun.adjusted_remaining_reads;
  const assembled = pipelineRun && pipelineRun.assembled === 1;

  return compact([
    stageTwoComplete && NON_HOST_READS_LABEL,
    assembled && NON_HOST_CONTIGS_LABEL,
    assembled && NON_HOST_CONTIGS_MAPPING_LABEL,
    stageTwoComplete && UNMAPPED_READS_LABEL,
    RESULTS_FOLDER_LABEL
  ]);
};

// Convert options to download options.
export const getDownloadDropdownOptions = pipelineRun => {
  const downloadOptions = getDownloadOptions(pipelineRun);

  return downloadOptions.map(option => ({
    text: option,
    value: option
  }));
};

// Get a map of download option to download path and
// whether to open link in new page.
const getDownloadLinkInfoMap = (sampleId, pipelineRun) => ({
  [NON_HOST_READS_LABEL]: {
    path: `/samples/${sampleId}/nonhost_fasta?pipeline_version=${
      pipelineRun.pipeline_version
    }`,
    newPage: false
  },
  [NON_HOST_CONTIGS_LABEL]: {
    path: `/samples/${sampleId}/contigs_fasta?pipeline_version=${
      pipelineRun.pipeline_version
    }`,
    newPage: false
  },
  [NON_HOST_CONTIGS_MAPPING_LABEL]: {
    path: `/samples/${sampleId}/contigs_summary?pipeline_version=${
      pipelineRun.pipeline_version
    }`,
    newPage: false
  },
  [UNMAPPED_READS_LABEL]: {
    path: `/samples/${sampleId}/unidentified_fasta?pipeline_version=${
      pipelineRun.pipeline_version
    }`,
    newPage: false
  },
  [RESULTS_FOLDER_LABEL]: {
    path: `/samples/${sampleId}/results_folder`,
    newPage: true
  }
});

export const getLinkInfoForDownloadOption = (option, sampleId, pipelineRun) =>
  getDownloadLinkInfoMap(sampleId, pipelineRun)[option];

export const getDownloadLinks = (sampleId, pipelineRun) => {
  const downloadOptions = getDownloadOptions(pipelineRun);

  const downloadLinkInfoMap = getDownloadLinkInfoMap(sampleId, pipelineRun);

  return downloadOptions.map(option => ({
    label: option,
    path: downloadLinkInfoMap[option].path,
    newPage: downloadLinkInfoMap[option].newPage
  }));
};
