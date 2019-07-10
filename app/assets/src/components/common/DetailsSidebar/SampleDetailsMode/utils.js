import moment from "moment";
import { numberWithCommas } from "~/helpers/strings";

// Compute display values for Pipeline Info from server response.
export const processPipelineInfo = (additionalInfo, showPipelineVizLink) => {
  const {
    pipeline_run: pipelineRun,
    summary_stats: summaryStats,
  } = additionalInfo;

  const pipelineInfo = {};

  const BLANK_TEXT = "unknown";

  if (pipelineRun) {
    const totalErccReads = pipelineRun.total_ercc_reads
      ? numberWithCommas(pipelineRun.total_ercc_reads)
      : 0;

    const erccPercent =
      pipelineRun.total_ercc_reads && pipelineRun.total_reads
        ? ` (${(
            100.0 *
            pipelineRun.total_ercc_reads /
            pipelineRun.total_reads
          ).toFixed(2)}%)`
        : "";

    pipelineInfo.totalReads = {
      text: numberWithCommas(pipelineRun.total_reads),
    };
    pipelineInfo.totalErccReads = { text: `${totalErccReads}${erccPercent}` };
    pipelineInfo.pipelineVersion = {
      text: `v${pipelineRun.version.pipeline}`,
      ...(showPipelineVizLink
        ? {
            linkLabel: "View Pipeline Visualization",
            link: `/samples/${pipelineRun.sample_id}/stage_results`,
          }
        : {}),
    };
  }

  if (summaryStats) {
    const adjustedRemainingReads = summaryStats.adjusted_remaining_reads
      ? numberWithCommas(summaryStats.adjusted_remaining_reads)
      : BLANK_TEXT;

    const adjustedPercent = summaryStats.percent_remaining
      ? ` (${summaryStats.percent_remaining.toFixed(2)}%)`
      : "";

    const unmappedReads = summaryStats.unmapped_reads
      ? numberWithCommas(summaryStats.unmapped_reads)
      : BLANK_TEXT;

    const qcPercent = summaryStats.qc_percent
      ? `${summaryStats.qc_percent.toFixed(2)}%`
      : BLANK_TEXT;

    const compressionRatio = summaryStats.compression_ratio
      ? summaryStats.compression_ratio.toFixed(2)
      : BLANK_TEXT;

    pipelineInfo.nonhostReads = {
      text: `${adjustedRemainingReads}${adjustedPercent}`,
    };
    pipelineInfo.unmappedReads = { text: unmappedReads };
    pipelineInfo.qcPercent = { text: qcPercent };
    pipelineInfo.compressionRatio = { text: compressionRatio };
    pipelineInfo.lastProcessedAt = {
      text: moment(summaryStats.last_processed_at).format("YYYY-MM-DD"),
    };
  }

  return pipelineInfo;
};

// Format the upload date.
export const processAdditionalInfo = additionalInfo => ({
  ...additionalInfo,
  upload_date: moment(additionalInfo.upload_date).format("YYYY-MM-DD"),
});
