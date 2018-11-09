import moment from "moment";
import { keyBy, mapValues } from "lodash";
import numberWithCommas from "~/helpers/strings";

// Transform the server metadata response to a simple key => value map.
export const processMetadata = metadata => {
  let newMetadata = keyBy(metadata, "key");

  newMetadata = mapValues(
    newMetadata,
    val =>
      val.data_type === "string"
        ? val.text_validated_value
        : val.number_validated_value
  );

  return newMetadata;
};

export const processMetadataTypes = metadataTypes =>
  keyBy(metadataTypes, "key");

// Compute display values for Pipeline Info from server response.
export const processPipelineInfo = additionalInfo => {
  const {
    pipeline_run: pipelineRun,
    summary_stats: summaryStats
  } = additionalInfo;
  const BLANK_TEXT = "unknown";
  const totalErccReads = pipelineRun.total_ercc_reads
    ? numberWithCommas(pipelineRun.total_ercc_reads)
    : 0;

  const erccPercent = pipelineRun.total_ercc_reads
    ? ` (${(
        100.0 *
        pipelineRun.total_ercc_reads /
        pipelineRun.total_reads
      ).toFixed(2)}%)`
    : "";

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

  return {
    totalReads: numberWithCommas(pipelineRun.total_reads),
    totalErccReads: `${totalErccReads}${erccPercent}`,
    nonhostReads: `${adjustedRemainingReads}${adjustedPercent}`,
    unmappedReads,
    qcPercent,
    compressionRatio: compressionRatio,
    lastProcessedAt: moment(summaryStats.last_processed_at).format("MM/DD/YYYY")
  };
};

// Format the upload date.
export const processAdditionalInfo = additionalInfo => ({
  ...additionalInfo,
  upload_date: moment(additionalInfo.upload_date).format("MM/DD/YYYY")
});
