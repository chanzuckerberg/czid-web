import { find, get, isUndefined, mapValues } from "lodash/fp";
import moment from "moment";
import { AMR_PIPELINE_HELP_LINK } from "~/components/utils/documentationLinks";
import { WORKFLOW_TABS } from "~/components/utils/workflows";
import {
  CG_WETLAB_OPTIONS,
  ILLUMINA,
  SEQUENCING_TECHNOLOGY_DISPLAY_NAMES,
  SEQUENCING_TECHNOLOGY_OPTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { numberWithCommas, numberWithPlusOrMinus } from "~/helpers/strings";
import { WorkflowRun } from "~/interface/sample";
import { AmrPipelineTabInfo, MngsPipelineInfo } from "./PipelineTab";
import { AdditionalInfo } from "./SampleDetailsMode";

const BLANK_TEXT = "unknown";
const YYYY_MM_DD = "YYYY-MM-DD";
const PIPELINE_VIZ_LINK_TEXT = "View Pipeline Visualization";

// Compute display values for Pipeline Info from server response.
export const processPipelineInfo = (
  additionalInfo: AdditionalInfo,
): MngsPipelineInfo => {
  const { pipeline_run: pipelineRun, summary_stats: summaryStats } =
    additionalInfo;

  const pipelineInfo: MngsPipelineInfo = {};

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
    pipelineInfo.totalErccReads = {
      text: totalErccReads ? `${totalErccReads}${erccPercent}` : "--",
    };
    if (pipelineRun.version.pipeline) {
      pipelineInfo.pipelineVersion = {
        text: `v${pipelineRun.version.pipeline}`,
        linkLabel: PIPELINE_VIZ_LINK_TEXT,
        link: `/samples/${pipelineRun.sample_id}/pipeline_viz/${pipelineRun.version.pipeline}`,
      };
    }
    pipelineInfo.hostSubtracted = { text: pipelineRun.host_subtracted };

    pipelineInfo.workflow = {
      text:
        get("technology", pipelineRun) ===
        SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA
          ? WORKFLOW_TABS.SHORT_READ_MNGS
          : WORKFLOW_TABS.LONG_READ_MNGS,
    };

    // Analysis type for both Illumina & ONT mNGS is "Metagenomic", so decouple it from workflow field.
    pipelineInfo.analysisType = {
      text: WORKFLOW_TABS.SHORT_READ_MNGS,
    };

    pipelineInfo.technology = {
      text: SEQUENCING_TECHNOLOGY_DISPLAY_NAMES[get("technology", pipelineRun)],
    };

    pipelineInfo.ncbiIndexDate = {
      text: pipelineRun?.version?.alignment_db,
    };
    pipelineInfo.guppyBasecallerVersion = {
      text: pipelineRun?.guppy_basecaller_setting,
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
        text: moment(summaryStats.last_processed_at).format(YYYY_MM_DD),
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
    lastProcessedAt: moment(get("executed_at", workflowRun)).format(YYYY_MM_DD),
    hostSubtracted: "Human",
    mappedReads: isUndefined(mappedReads) ? "" : numberWithCommas(mappedReads),
    medakaModel: get("inputs.medaka_model", workflowRun),
    totalReads: isUndefined(totalReads) ? "" : numberWithCommas(totalReads),
    pipelineVersion: get("wdl_version", workflowRun),
    technology:
      SEQUENCING_TECHNOLOGY_DISPLAY_NAMES[
        get("inputs.technology", workflowRun)
      ],
    wetlabProtocol: get(
      "text",
      find(
        { value: get("inputs.wetlab_protocol", workflowRun) },
        CG_WETLAB_OPTIONS,
      ),
    ),
    workflow: WORKFLOW_TABS[workflowRun.workflow],
  };

  return mapValues(v => ({ text: v }), cgWorkflowRunInfo);
};

export const processAMRWorkflowRun = (
  workflowRun: WorkflowRun,
): AmrPipelineTabInfo => {
  const {
    workflow,
    executed_at: executedAt,
    wdl_version: pipelineVersion,
    parsed_cached_results,
    inputs,
  } = workflowRun;

  const qualityMetrics = parsed_cached_results?.quality_metrics;

  const workflowLabel = WORKFLOW_TABS[workflow];
  const lastProcessedAt = moment(executedAt).format(YYYY_MM_DD);
  const cardDbVersion = inputs?.card_version;
  const wildcardVersion = inputs?.wildcard_version;

  const pipelineVersionInfo = {
    text: pipelineVersion,
    linkLabel: PIPELINE_VIZ_LINK_TEXT,
    link: AMR_PIPELINE_HELP_LINK,
  };

  if (qualityMetrics) {
    const {
      total_reads: totalReads,
      total_ercc_reads: totalErccReads,
      adjusted_remaining_reads: adjustedRemainingReads,
      percent_remaining: percentRemaining,
      qc_percent: qcPercentOriginal,
      compression_ratio: compressionRatioOriginal,
      insert_size_mean: insertSizeMean,
      insert_size_standard_deviation: insertSizeStandardDeviation,
    } = qualityMetrics;

    const nonHostReads =
      adjustedRemainingReads && percentRemaining
        ? `${numberWithCommas(
            adjustedRemainingReads,
          )} (${percentRemaining.toFixed(2)}%)`
        : BLANK_TEXT;
    const qcPercent = qcPercentOriginal
      ? `${qcPercentOriginal.toFixed(2)}%`
      : BLANK_TEXT;
    const compressionRatio = compressionRatioOriginal
      ? compressionRatioOriginal.toFixed(2)
      : BLANK_TEXT;
    const meanInsertSize = numberWithPlusOrMinus(
      insertSizeMean,
      insertSizeStandardDeviation,
    );

    return {
      analysisType: { text: workflowLabel },
      workflow: { text: workflowLabel },
      technology: { text: ILLUMINA }, // Currently the only supported technology for AMR
      pipelineVersion: pipelineVersionInfo,
      cardDatabaseVersion: { text: cardDbVersion },
      lastProcessedAt: { text: lastProcessedAt },
      totalReads: { text: numberWithCommas(totalReads) },
      totalErccReads: { text: numberWithCommas(totalErccReads) },
      nonhostReads: { text: nonHostReads },
      qcPercent: { text: qcPercent },
      compressionRatio: { text: compressionRatio },
      meanInsertSize: { text: meanInsertSize },
      wildcardDatabaseVersion: { text: wildcardVersion },
    };
  } else {
    return {
      analysisType: { text: workflowLabel },
      workflow: { text: workflowLabel },
      technology: { text: ILLUMINA }, // Currently the only supported technology for AMR
      pipelineVersion: pipelineVersionInfo,
      cardDatabaseVersion: { text: cardDbVersion },
      lastProcessedAt: { text: lastProcessedAt },
      wildcardDatabaseVersion: { text: wildcardVersion },
    };
  }
};

// Format the upload date.
export const processAdditionalInfo = (additionalInfo: AdditionalInfo) => ({
  ...additionalInfo,
  upload_date: moment(additionalInfo.upload_date).format(YYYY_MM_DD),
});
