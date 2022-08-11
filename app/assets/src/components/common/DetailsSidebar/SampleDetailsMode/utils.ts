import { find, get, isUndefined, mapValues } from "lodash/fp";
import moment from "moment";

import { WORKFLOWS } from "~/components/utils/workflows";
import {
  CG_TECHNOLOGY_DISPLAY_NAMES,
  CG_TECHNOLOGY_OPTIONS,
  CG_WETLAB_OPTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { numberWithCommas, numberWithPlusOrMinus } from "~/helpers/strings";
import { PipelineInfo } from "./PipelineTab";
import { AdditionalInfo } from "./SampleDetailsMode";

// Compute display values for Pipeline Info from server response.
export const processPipelineInfo = (
  additionalInfo: AdditionalInfo,
): PipelineInfo => {
  const {
    pipeline_run: pipelineRun,
    summary_stats: summaryStats,
  } = additionalInfo;

  const pipelineInfo: PipelineInfo = {};

  const BLANK_TEXT = "unknown";

  if (pipelineRun) {
    const totalErccReads = pipelineRun.total_ercc_reads
      ? numberWithCommas(pipelineRun.total_ercc_reads)
      : 0;

    const erccPercent =
      pipelineRun.total_ercc_reads && pipelineRun.total_reads
        ? ` (${(
            (100.0 * pipelineRun.total_ercc_reads) /
            pipelineRun.total_reads
          ).toFixed(2)}%)`
        : "";

    pipelineInfo.totalReads = {
      text: numberWithCommas(pipelineRun.total_reads),
    };
    pipelineInfo.totalErccReads = { text: `${totalErccReads}${erccPercent}` };
    if (pipelineRun.version.pipeline) {
      pipelineInfo.pipelineVersion = {
        text: `v${pipelineRun.version.pipeline}`,
        linkLabel: "View Pipeline Visualization",
        link: `/samples/${pipelineRun.sample_id}/pipeline_viz/${pipelineRun.version.pipeline}`,
      };
    }
    pipelineInfo.hostSubtracted = { text: pipelineRun.host_subtracted };

    pipelineInfo.workflow = {
      text: WORKFLOWS.SHORT_READ_MNGS.label,
    };

    pipelineInfo.technology = {
      text: CG_TECHNOLOGY_DISPLAY_NAMES[CG_TECHNOLOGY_OPTIONS.ILLUMINA],
    };

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

      const meanInsertSize = numberWithPlusOrMinus(
        summaryStats.insert_size_mean,
        summaryStats.insert_size_standard_deviation,
      );

      if (meanInsertSize) {
        pipelineInfo.meanInsertSize = { text: meanInsertSize };
      }
    }
  }

  return pipelineInfo;
};

export const processCGWorkflowRunInfo = workflowRun => {
  const qualityMetrics = get(
    "parsed_cached_results.quality_metrics",
    workflowRun,
  );
  const erccMappedReads = get("ercc_mapped_reads", qualityMetrics);
  const mappedReads = get("mapped_reads", qualityMetrics);
  const totalReads = get("total_reads", qualityMetrics);

  const cgWorkflowRunInfo = {
    erccMappedReads: isUndefined(erccMappedReads)
      ? ""
      : numberWithCommas(erccMappedReads),
    lastProcessedAt: moment(get("executed_at", workflowRun)).format(
      "YYYY-MM-DD",
    ),
    hostSubtracted: "Human",
    mappedReads: isUndefined(mappedReads) ? "" : numberWithCommas(mappedReads),
    medakaModel: get("inputs.medaka_model", workflowRun),
    totalReads: isUndefined(totalReads) ? "" : numberWithCommas(totalReads),
    pipelineVersion: get("wdl_version", workflowRun),
    technology:
      CG_TECHNOLOGY_DISPLAY_NAMES[get("inputs.technology", workflowRun)],
    wetlabProtocol: get(
      "text",
      find(
        { value: get("inputs.wetlab_protocol", workflowRun) },
        CG_WETLAB_OPTIONS,
      ),
    ),
    workflow: get("label", find({ value: workflowRun.workflow }, WORKFLOWS)),
  };

  return mapValues(v => ({ text: v }), cgWorkflowRunInfo);
};

// Format the upload date.
export const processAdditionalInfo = (additionalInfo: AdditionalInfo) => ({
  ...additionalInfo,
  upload_date: moment(additionalInfo.upload_date).format("YYYY-MM-DD"),
});
