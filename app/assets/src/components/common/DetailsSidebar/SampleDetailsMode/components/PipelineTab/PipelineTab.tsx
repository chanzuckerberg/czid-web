import cx from "classnames";
import { filter, get, isEmpty, pick } from "lodash/fp";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { getSamplePipelineResults } from "~/api";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import { ERCCScatterPlot } from "~/components/common/DetailsSidebar/SampleDetailsMode/components/PipelineTab/components/ERCCScatterPlot";
import LoadingMessage from "~/components/common/LoadingMessage";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { getDownloadLinks } from "~/components/utils/download";
import { isPipelineVersionAtLeast } from "~/components/utils/pipeline_versions";
import {
  READ_DEDUP_KEYS,
  RESULTS_FOLDER_ROOT_KEY,
  RESULTS_FOLDER_STAGE_KEYS,
  RESULTS_FOLDER_STEP_KEYS,
} from "~/components/utils/resultsFolder";
import { FIELDS_METADATA } from "~/components/utils/tooltip";
import {
  getWorkflowTypeFromLabel,
  WorkflowLabelType,
  WorkflowType,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";
import { WorkflowRun } from "~/interface/sample";
import {
  ERCCComparisonShape,
  PipelineRun,
  SampleId,
  SnapshotShareId,
} from "~/interface/shared";
import Link from "~ui/controls/Link";
import {
  AMR_WORKFLOW_INFO_FIELDS,
  CG_WORKFLOW_INFO_FIELDS,
  HOST_FILTERING_WIKI,
  LONG_READ_MNGS_INFO_FIELDS,
  SHORT_READ_MNGS_INFO_FIELDS,
} from "../../constants";
import MetadataSection from "../../MetadataSection";
import cs from "../../sample_details_mode.scss";
import { MngsPipelineInfo, PipelineInfo, PipelineStepDictState } from "./types";
import {
  processAMRWorkflowRun,
  processCGWorkflowRunInfo,
  processPipelineInfo,
} from "./utils";
import { PipelineTabFragment$key } from "./__generated__/PipelineTabFragment.graphql";

const READ_COUNTS_TABLE = "readsRemaining";
const ERCC_PLOT = "erccScatterplot";

export const PipelineTabFragment = graphql`
  fragment PipelineTabFragment on query_SampleMetadata_additional_info {
    ercc_comparison {
      actual
      expected
      name
    }
    pipeline_run {
      error_message
      guppy_basecaller_setting
      host_subtracted
      job_status
      mapped_reads
      adjusted_remaining_reads
      alert_sent
      alignment_config_id
      assembled
      compression_ratio
      created_at
      dag_vars
      deleted_at
      deprecated
      executed_at
      finalized
      fraction_subsampled
      fraction_subsampled_bases
      known_user_error
      max_input_fragments
      pipeline_branch
      pipeline_commit
      pipeline_execution_strategy
      pipeline_version
      qc_percent
      results_finalized
      s3_output_prefix
      sample_id
      sfn_execution_arn
      subsample
      technology
      time_to_finalized
      time_to_results_finalized
      total_bases
      total_ercc_reads
      total_reads
      truncated
      truncated_bases
      unmapped_bases
      unmapped_reads
      updated_at
      use_taxon_whitelist
      wdl_version
      version {
        alignment_db
        pipeline
      }
    }
    summary_stats {
      adjusted_remaining_reads
      compression_ratio
      insert_size_mean
      insert_size_standard_deviation
      last_processed_at
      percent_remaining
      qc_percent
      reads_after_bowtie2_ercc_filtered
      reads_after_bowtie2_host_filtered
      reads_after_czid_dedup
      reads_after_fastp
      reads_after_hisat2_host_filtered
      unmapped_reads
    }
  }
`;

interface PipelineTabProps {
  currentRun?: WorkflowRun | PipelineRun;
  currentWorkflowTab?: WorkflowLabelType;
  sampleId: SampleId;
  snapshotShareId?: SnapshotShareId;
  erccComparison?: ERCCComparisonShape[];
  pipelineTabFragmentKey: PipelineTabFragment$key;
}

export const PipelineTab = ({
  currentRun,
  currentWorkflowTab,
  snapshotShareId,
  sampleId,
  pipelineTabFragmentKey,
}: PipelineTabProps) => {
  const data = useFragment<PipelineTabFragment$key>(
    PipelineTabFragment,
    pipelineTabFragmentKey,
  );

  const pipelineRun = data?.pipeline_run;

  const pipelineInfoRaw: MngsPipelineInfo | null = processPipelineInfo(data);

  const erccComparison:
    | ReadonlyArray<ERCCComparisonShape | null | undefined>
    | null
    | undefined = data?.ercc_comparison;

  let pipelineInfo: PipelineInfo | null = pipelineInfoRaw;
  if (currentWorkflowTab === WORKFLOW_TABS.CONSENSUS_GENOME) {
    pipelineInfo = processCGWorkflowRunInfo(currentRun);
  } else if (currentWorkflowTab === WORKFLOW_TABS.AMR) {
    pipelineInfo = processAMRWorkflowRun(currentRun as WorkflowRun);
  } else {
    pipelineInfo = processPipelineInfo(data);
  }

  const _graphContainer = useRef<HTMLDivElement>(null);
  const { stageDescriptionKey, stepsKey } = RESULTS_FOLDER_STAGE_KEYS;

  const [sectionOpen, setSectionOpen] = useState({
    pipelineInfo: true,
    [READ_COUNTS_TABLE]: false,
    [ERCC_PLOT]: false,
    downloads: false,
  });
  const [graphWidth, setGraphWidth] = useState(0);
  const [loading, setLoading] = useState([READ_COUNTS_TABLE]);
  const [pipelineStepDict, setPipelineStepDict] =
    useState<PipelineStepDictState>({});

  const INFO_FIELDS_FOR_WORKFLOW = {
    [WorkflowType.AMR]: AMR_WORKFLOW_INFO_FIELDS,
    [WorkflowType.CONSENSUS_GENOME]: CG_WORKFLOW_INFO_FIELDS,
    [WorkflowType.SHORT_READ_MNGS]: SHORT_READ_MNGS_INFO_FIELDS,
    [WorkflowType.LONG_READ_MNGS]: LONG_READ_MNGS_INFO_FIELDS,
  };

  useEffect(() => {
    if (_graphContainer.current && graphWidth === 0) {
      setGraphWidth(_graphContainer.current.getBoundingClientRect().width);
    }
  });

  const toggleSection = (section: keyof typeof sectionOpen) => {
    const toggleValue = !sectionOpen[section];
    setSectionOpen({ ...sectionOpen, [section]: toggleValue });
  };

  const getPipelineInfoField = (field: { name: string; key: string }) => {
    const { text, linkLabel, link } = pipelineInfo?.[field.key] || {};

    const metadataLink = !snapshotShareId && linkLabel && link && (
      <Link href={link}>{linkLabel}</Link>
    );

    return {
      label: field.name,
      value:
        text === undefined || text === null || text === "" ? (
          <div className={cs.emptyValue}>--</div>
        ) : (
          <div className={cs.metadataValue}>
            <span className={cs.pipelineVersion}>{text}</span>
            <span className={cs.vizLink}>{metadataLink}</span>
          </div>
        ),
      fieldMetadata: get(field.key, FIELDS_METADATA),
    };
  };

  const getReadCounts = useCallback(async () => {
    const pipelineResults = await getSamplePipelineResults(
      sampleId,
      pipelineRun && pipelineRun.pipeline_version,
    );

    if (pipelineResults && pipelineResults[RESULTS_FOLDER_ROOT_KEY]) {
      const hostFilteringStageKey = Object.keys(
        pipelineResults[RESULTS_FOLDER_ROOT_KEY],
      )[0];
      if (hostFilteringStageKey === undefined) {
        return;
      }

      // Remove the host filtering steps that have readsAfter === null;
      // With the modern host filtering step (as of Nov, 2022) - the following steps may have no readsAfter
      // (depends on sample type.. e.g. host genome type, paired-end vs single-end), DNA, RNA, etc...):
      //    Bowtie2 Human Filter, Hisat2 Human Filter, CollectInsertSizeMetrics, Kallisto
      const hostFilteringStageResults =
        pipelineResults[RESULTS_FOLDER_ROOT_KEY][hostFilteringStageKey];
      const readsRemainingByHostFilteringSteps =
        hostFilteringStageResults[stepsKey];
      const hostFilteringStepKeysWithReadsRemaining = filter(
        (stepKey: string) =>
          get("readsAfter", readsRemainingByHostFilteringSteps[stepKey]) > 0,
        Object.keys(readsRemainingByHostFilteringSteps),
      );
      hostFilteringStageResults[stepsKey] = pick(
        hostFilteringStepKeysWithReadsRemaining,
        readsRemainingByHostFilteringSteps,
      );
      setPipelineStepDict(hostFilteringStageResults);
      setLoading(prevState =>
        prevState.filter(section => section !== READ_COUNTS_TABLE),
      );
    }
  }, [sampleId, pipelineRun, stepsKey]);

  const getSequenceType = (technology: string) => {
    switch (technology) {
      case SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA:
        return "total_reads";
      case SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE:
        return "total_bases";
      default:
        return undefined;
    }
  };

  const renderReadCountsTable = (stepKey: string) => {
    const { stepNameKey, readsAfterKey, stepDescriptionKey } =
      RESULTS_FOLDER_STEP_KEYS;

    const totalCount = get(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      getSequenceType(pipelineRun?.technology),
      pipelineRun,
    );
    const step = pipelineStepDict[stepsKey][stepKey];
    const stepName = step[stepNameKey];

    // Need to change this to total_bases if ONT
    let readsAfter = step[readsAfterKey];
    if (readsAfter === null) {
      return;
    }

    // Special case idseq-dedup. All steps after idseq-dedup transform their counts by
    // in the pipeline by the compression ratio to return nonunique reads.
    let uniqueReads = null;
    const readDedupKeys = READ_DEDUP_KEYS;
    if (
      readDedupKeys.includes(stepKey) &&
      pipelineRun?.pipeline_version &&
      isPipelineVersionAtLeast(pipelineRun.pipeline_version, "4.0.0")
    ) {
      // Property order is predictable in JavaScript objects since ES2015
      const stepKeys = Object.keys(pipelineStepDict[stepsKey]);
      const previousStepKey =
        stepKeys[stepKeys.findIndex(key => key === stepKey) - 1];
      const previousStep = pipelineStepDict[stepsKey][previousStepKey];
      uniqueReads = readsAfter;
      readsAfter = previousStep[readsAfterKey];
    }

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2363
    const percentReads = ((readsAfter / totalCount) * 100).toFixed(2);

    return (
      <div className={cs.readsRemainingRow}>
        <div className={cs.label}>
          <ColumnHeaderTooltip
            position="top left"
            trigger={<div className={cs.labelText}>{stepName}</div>}
            content={step[stepDescriptionKey]}
            title={stepName}
          />
        </div>
        <div className={cs.narrowMetadataValueContainer}>
          <div className={cs.metadataValue}>
            {readsAfter ? readsAfter.toLocaleString() : ""}
            {uniqueReads && (
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
              <div>{` (${uniqueReads.toLocaleString()} unique)`}</div>
            )}
          </div>
        </div>
        <div className={cs.narrowMetadataValueContainer}>
          <div className={cs.metadataValue}>{percentReads}%</div>
        </div>
      </div>
    );
  };

  const readsPresent = () => {
    if (isEmpty(pipelineStepDict)) {
      return false;
    }

    const stepInformationPresent = Object.prototype.hasOwnProperty.call(
      pipelineStepDict,
      "steps",
    );
    if (!stepInformationPresent) {
      return false;
    }

    const readsPresent = Object.values(pipelineStepDict["steps"]).reduce(
      (accum, step) => {
        if (step.readsAfter) {
          accum = true;
        }
        return accum;
      },
      false,
    );

    return stepInformationPresent && readsPresent;
  };

  const renderReadsRemainingSection = (title: string) => {
    if (loading.includes(READ_COUNTS_TABLE)) {
      return <LoadingMessage message="Loading" className={cs.loading} />;
    }

    if (
      !pipelineRun ||
      (!pipelineRun.total_reads && !pipelineRun.total_bases) ||
      !readsPresent()
    ) {
      return <div className={cs.noData}>No data</div>;
    }

    return (
      <div>
        <div className={cs.readsRemainingRow}>
          <div className={cs.label}>
            <ColumnHeaderTooltip
              position="top left"
              trigger={
                <div className={cx(cs.labelText, cs.header)}>
                  Filtering Step
                </div>
              }
              content={pipelineStepDict[stageDescriptionKey]}
              title="Host Filtering"
              link={HOST_FILTERING_WIKI}
            />
          </div>
          <div className={cs.narrowMetadataValueContainer}>
            <div className={cs.labelText}>{title}</div>
          </div>
          <div className={cs.narrowMetadataValueContainer}>
            <div className={cs.labelText}>% {title}</div>
          </div>
        </div>
        {Object.keys(pipelineStepDict[stepsKey]).map(stepKey => (
          <div key={stepKey}>{renderReadCountsTable(stepKey)}</div>
        ))}
      </div>
    );
  };

  const renderErccComparison = () => {
    if (!pipelineRun) {
      return <LoadingMessage message="Loading" className={cs.loading} />;
    }

    if (!erccComparison) {
      return <div className={cs.noData}>No data</div>;
    }

    return (
      <ERCCScatterPlot
        erccComparison={erccComparison}
        width={graphWidth}
        height={0.7 * graphWidth}
      />
    );
  };

  const workflow: WorkflowLabelType =
    get(["workflow", "text"], pipelineInfo) ?? WORKFLOW_TABS.SHORT_READ_MNGS;
  const mngsWorkflows = [
    WORKFLOW_TABS.SHORT_READ_MNGS,
    WORKFLOW_TABS.LONG_READ_MNGS,
  ] as WorkflowLabelType[];
  const workflowIsMngs = mngsWorkflows.includes(workflow);

  useEffect(() => {
    !snapshotShareId && workflowIsMngs && getReadCounts();
  }, [getReadCounts, snapshotShareId, workflowIsMngs]);

  const fields = INFO_FIELDS_FOR_WORKFLOW[getWorkflowTypeFromLabel(workflow)];

  const pipelineInfoFields = fields.map(getPipelineInfoField);
  const title =
    pipelineRun?.technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE
      ? "Bases Remaining"
      : "Reads Remaining";

  if (!pipelineInfo) {
    return <LoadingMessage message="Loading" className={cs.loading} />;
  }
  return (
    <div>
      <MetadataSection
        toggleable
        onToggle={() => toggleSection("pipelineInfo")}
        open={sectionOpen.pipelineInfo}
        title="Pipeline Info"
      >
        <FieldList
          fields={pipelineInfoFields}
          className={cs.pipelineInfoFields}
        />
      </MetadataSection>
      {!snapshotShareId && workflowIsMngs && (
        <React.Fragment>
          <MetadataSection
            toggleable
            onToggle={() => toggleSection(READ_COUNTS_TABLE)}
            open={sectionOpen[READ_COUNTS_TABLE]}
            title={title}
          >
            {renderReadsRemainingSection(title)}
          </MetadataSection>
          <MetadataSection
            toggleable
            onToggle={() => toggleSection("erccScatterplot")}
            open={sectionOpen.erccScatterplot}
            title="ERCC Spike-In Counts"
            className={cs.erccScatterplotSection}
          >
            <div ref={_graphContainer} className={cs.graphContainer}>
              {renderErccComparison()}
            </div>
          </MetadataSection>
          <MetadataSection
            toggleable
            onToggle={() => toggleSection("downloads")}
            open={sectionOpen.downloads}
            title="Downloads"
          >
            <div className={cs.downloadSectionContent}>
              {pipelineRun &&
                getDownloadLinks(sampleId, pipelineRun).map(option => (
                  <a
                    key={option.label}
                    className={cs.downloadLink}
                    href={option.path}
                    target={option.newPage ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                  >
                    {option.label}
                  </a>
                ))}
            </div>
          </MetadataSection>
        </React.Fragment>
      )}
    </div>
  );
};
