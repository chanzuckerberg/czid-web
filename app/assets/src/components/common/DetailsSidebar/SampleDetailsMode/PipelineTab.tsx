import cx from "classnames";
import { get, set, isEmpty } from "lodash/fp";
import React from "react";

import { getSamplePipelineResults } from "~/api";
import { trackEvent } from "~/api/analytics";
import ERCCScatterPlot from "~/components/ERCCScatterPlot";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import { IconArrowRight } from "~/components/ui/icons";
import {
  RESULTS_FOLDER_STAGE_KEYS,
  RESULTS_FOLDER_STEP_KEYS,
  READ_DEDUP_KEYS,
  RESULTS_FOLDER_ROOT_KEY,
} from "~/components/utils/resultsFolder";
import { FIELDS_METADATA } from "~/components/utils/tooltip";
import { WORKFLOWS } from "~/components/utils/workflows";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";
import { getDownloadLinks } from "~/components/views/report/utils/download";
import {
  ERCCComparisonShape,
  PipelineRun,
  SampleId,
  SnapshotShareId,
} from "~/interface/shared";
import Link from "~ui/controls/Link";
import LoadingMessage from "../../LoadingMessage";
import MetadataSection from "./MetadataSection";
import {
  CG_WORKFLOW_INFO_FIELDS,
  HOST_FILTERING_WIKI,
  AMR_WORKFLOW_INFO_FIELDS,
  SHORT_READ_MNGS_INFO_FIELDS,
  LONG_READ_MNGS_INFO_FIELDS,
} from "./constants";
import cs from "./sample_details_mode.scss";

const READ_COUNTS_TABLE = "readsRemaining";
const ERCC_PLOT = "erccScatterplot";

export type PipelineInfo = AmrPipelineTabInfo | MngsPipelineInfo;

interface PipelineTabProps {
  pipelineInfo: PipelineInfo;
  sampleId: SampleId;
  snapshotShareId?: SnapshotShareId;
  erccComparison?: ERCCComparisonShape[];
  pipelineRun?: PipelineRun;
}

export interface MngsPipelineInfo {
  [key: string]: {
    text?: string;
    link?: string;
    linkLabel?: string;
  };
}

export interface AmrPipelineTabInfo {
  workflow: { text: string };
  technology: { text: string };
  pipelineVersion: { text: string };
  totalReads?: { text: string };
  totalErccReads?: { text: string };
  nonHostReads?: { text: string };
  qcPercent?: { text: string };
  compressionRatio?: { text: string };
  meanInsertSize?: { text: string };
  lastProcessedAt: { text: string };
}

interface PipelineTabState {
  sectionOpen: {
    pipelineInfo: boolean;
    [READ_COUNTS_TABLE]: boolean;
    [ERCC_PLOT]: boolean;
    downloads: boolean;
  };
  sectionEditing: { [key: string]: boolean };
  graphWidth: number;
  loading: string[];
  pipelineStepDict:
    | {
        name: string;
        stageDescription: string;
        steps: {
          [key: string]: {
            fileList: {
              displayName: string;
              key: string | null;
              url: string | null;
            }[];
            name: string;
            readsAfter: number | null;
            stepDescription: string;
          };
        };
      }
    | Record<string, never>;
}

class PipelineTab extends React.Component<PipelineTabProps, PipelineTabState> {
  private _graphContainer: { offsetWidth: number };
  state: PipelineTabState = {
    sectionOpen: {
      pipelineInfo: true,
      [READ_COUNTS_TABLE]: false,
      [ERCC_PLOT]: false,
      downloads: false,
    },
    sectionEditing: {},
    graphWidth: 0,
    loading: [READ_COUNTS_TABLE],
    pipelineStepDict: {},
  };

  INFO_FIELDS_FOR_WORKFLOW = {
    [WORKFLOWS.AMR.label]: AMR_WORKFLOW_INFO_FIELDS,
    [WORKFLOWS.CONSENSUS_GENOME.label]: CG_WORKFLOW_INFO_FIELDS,
    [WORKFLOWS.SHORT_READ_MNGS.label]: SHORT_READ_MNGS_INFO_FIELDS,
    [WORKFLOWS.LONG_READ_MNGS.label]: LONG_READ_MNGS_INFO_FIELDS,
  };

  componentDidMount() {
    const { snapshotShareId } = this.props;
    this.updateGraphDimensions();
    !snapshotShareId && this.getReadCounts();
  }

  componentDidUpdate() {
    this.updateGraphDimensions();
  }

  updateGraphDimensions = () => {
    if (this._graphContainer && this.state.graphWidth === 0) {
      this.setState({
        graphWidth: this._graphContainer.offsetWidth,
      });
    }
  };

  toggleSection = section => {
    const { sectionOpen } = this.state;

    const newValue = !sectionOpen[section];
    this.setState({
      sectionOpen: set(section, newValue, sectionOpen),
    });
    trackEvent("PipelineTab_section_toggled", {
      section: section,
      sectionOpen: newValue,
      sampleId: this.props.sampleId,
    });
  };

  getPipelineInfoField = field => {
    const { pipelineInfo, snapshotShareId } = this.props;
    const { text, linkLabel, link } = pipelineInfo[field.key] || {};

    const metadataLink = !snapshotShareId && linkLabel && link && (
      <Link className={cs.vizLink} href={link}>
        {linkLabel}
        <IconArrowRight />
      </Link>
    );

    return {
      label: field.name,
      value:
        text === undefined || text === null || text === "" ? (
          <div className={cs.emptyValue}>--</div>
        ) : (
          <div
            className={cs.metadataValue}
            onClick={() =>
              trackEvent("PipelineTab_pipeline-visualization-link_clicked")
            }
          >
            {text}
            {metadataLink}
          </div>
        ),
      fieldMetadata: get(field.key, FIELDS_METADATA),
    };
  };

  getReadCounts = async () => {
    const { sampleId, pipelineRun } = this.props;
    const pipelineResults = await getSamplePipelineResults(
      sampleId,
      pipelineRun && pipelineRun.pipeline_version,
    );

    if (pipelineResults && pipelineResults[RESULTS_FOLDER_ROOT_KEY]) {
      const hostFilteringStageKey = Object.keys(
        pipelineResults[RESULTS_FOLDER_ROOT_KEY],
      )[0];
      this.setState(prevState => ({
        pipelineStepDict:
          pipelineResults[RESULTS_FOLDER_ROOT_KEY][hostFilteringStageKey],
        loading: prevState.loading.filter(
          section => section !== READ_COUNTS_TABLE,
        ),
      }));
    }
  };

  getSequenceType = (technology: string) => {
    switch (technology) {
      case SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA:
        return "total_reads";
      case SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE:
        return "total_bases";
      default:
        return undefined;
    }
  };

  renderReadCountsTable = (stepKey: string) => {
    const { pipelineRun } = this.props;
    const { pipelineStepDict } = this.state;
    const { stepsKey } = RESULTS_FOLDER_STAGE_KEYS;
    const {
      stepNameKey,
      readsAfterKey,
      stepDescriptionKey,
    } = RESULTS_FOLDER_STEP_KEYS;

    const totalCount = get(
      this.getSequenceType(pipelineRun?.technology),
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
    if (readDedupKeys.includes(stepKey) && pipelineRun.pipeline_version > "4") {
      // Property order is predictable in JavaScript objects since ES2015
      const stepKeys = Object.keys(pipelineStepDict[stepsKey]);
      const previousStepKey =
        stepKeys[stepKeys.findIndex(key => key === stepKey) - 1];
      const previousStep = pipelineStepDict[stepsKey][previousStepKey];
      uniqueReads = readsAfter;
      readsAfter = previousStep[readsAfterKey];
    }

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

  readsPresent = () => {
    const { pipelineStepDict } = this.state;

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

  renderReadsRemainingSection = (title: string) => {
    const { stageDescriptionKey, stepsKey } = RESULTS_FOLDER_STAGE_KEYS;
    const { pipelineRun } = this.props;
    const { loading, pipelineStepDict } = this.state;

    if (loading.includes(READ_COUNTS_TABLE)) {
      return <LoadingMessage message="Loading" className={cs.loading} />;
    }

    if (
      !pipelineRun ||
      (!pipelineRun.total_reads && !pipelineRun.total_bases) ||
      !this.readsPresent()
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
          <div key={stepKey}>{this.renderReadCountsTable(stepKey)}</div>
        ))}
      </div>
    );
  };

  renderErccComparison = () => {
    const { pipelineRun, erccComparison } = this.props;
    const { graphWidth } = this.state;

    if (!pipelineRun) {
      return <LoadingMessage message="Loading" className={cs.loading} />;
    }

    if (!erccComparison) {
      return <div className={cs.noData}>No data</div>;
    }

    return (
      <ERCCScatterPlot
        ercc_comparison={erccComparison}
        width={graphWidth}
        height={0.7 * graphWidth}
      />
    );
  };

  render() {
    const { pipelineInfo, pipelineRun, sampleId, snapshotShareId } = this.props;

    const workflow =
      get(["workflow", "text"], pipelineInfo) ||
      WORKFLOWS.SHORT_READ_MNGS.label;
    const workflowIsMngs = [
      WORKFLOWS.SHORT_READ_MNGS.label,
      WORKFLOWS.LONG_READ_MNGS.label,
    ].includes(workflow);

    const fields = this.INFO_FIELDS_FOR_WORKFLOW[workflow];

    const pipelineInfoFields = fields.map(this.getPipelineInfoField);
    const title =
      pipelineRun?.technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE ? "Bases Remaining" : "Reads Remaining";

    return (
      <div>
        <MetadataSection
          toggleable
          onToggle={() => this.toggleSection("pipelineInfo")}
          open={this.state.sectionOpen.pipelineInfo}
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
              onToggle={() => this.toggleSection(READ_COUNTS_TABLE)}
              open={this.state.sectionOpen[READ_COUNTS_TABLE]}
              title={title}
            >
              {this.renderReadsRemainingSection(title)}
            </MetadataSection>
            <MetadataSection
              toggleable
              onToggle={() => this.toggleSection("erccScatterplot")}
              open={this.state.sectionOpen.erccScatterplot}
              title="ERCC Spike-In Counts"
              className={cs.erccScatterplotSection}
            >
              <div
                ref={c => (this._graphContainer = c)}
                className={cs.graphContainer}
              >
                {this.renderErccComparison()}
              </div>
            </MetadataSection>
            <MetadataSection
              toggleable
              onToggle={() => this.toggleSection("downloads")}
              open={this.state.sectionOpen.downloads}
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
                      onClick={() =>
                        trackEvent("PipelineTab_download-link_clicked", {
                          newPage: option.newPage,
                          label: option.label,
                          href: option.path,
                          sampleId: this.props.sampleId,
                        })
                      }
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
  }
}

export default PipelineTab;
