import React from "react";
import { get, isEmpty, set } from "lodash/fp";
import cx from "classnames";

import ERCCScatterPlot from "~/components/ERCCScatterPlot";
import { WORKFLOWS } from "~/components/utils/workflows";
import PropTypes from "~/components/utils/propTypes";
import { getDownloadLinks } from "~/components/views/report/utils/download";
import { logAnalyticsEvent } from "~/api/analytics";
import { getSamplePipelineResults } from "~/api";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import { IconLoading } from "~/components/ui/icons";
import {
  RESULTS_FOLDER_STAGE_KEYS,
  RESULTS_FOLDER_STEP_KEYS,
  READ_DEDUP_KEYS,
  RESULTS_FOLDER_ROOT_KEY,
} from "~/components/utils/resultsFolder";

import {
  PIPELINE_INFO_FIELDS,
  WORKFLOW_INFO_FIELDS,
  HOST_FILTERING_WIKI,
} from "./constants";
import MetadataSection from "./MetadataSection";
import cs from "./sample_details_mode.scss";

const READ_COUNTS_TABLE = "readsRemaining";
const ERCC_PLOT = "erccScatterplot";

class PipelineTab extends React.Component {
  state = {
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
    logAnalyticsEvent("PipelineTab_section_toggled", {
      section: section,
      sectionOpen: newValue,
      sampleId: this.props.sampleId,
    });
  };

  getPipelineInfoField = field => {
    const { pipelineInfo, snapshotShareId } = this.props;
    const { text, linkLabel, link } = pipelineInfo[field.key] || {};

    const metadataLink = !snapshotShareId && linkLabel && link && (
      <a
        className={cs.vizLink}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkLabel}
        <i className={cx("fa fa-chevron-right", cs.rightArrow)} />
      </a>
    );

    return {
      label: field.name,
      value:
        text === undefined || text === null || text === "" ? (
          <div className={cs.emptyValue}>--</div>
        ) : (
          <div className={cs.metadataValue}>
            {text}
            {metadataLink}
          </div>
        ),
    };
  };

  getReadCounts = async () => {
    const { sampleId, pipelineRun } = this.props;
    const pipelineResults = await getSamplePipelineResults(
      sampleId,
      pipelineRun && pipelineRun.pipeline_version
    );

    if (pipelineResults && pipelineResults[RESULTS_FOLDER_ROOT_KEY]) {
      const hostFilteringStageKey = Object.keys(
        pipelineResults[RESULTS_FOLDER_ROOT_KEY]
      )[0];
      this.setState(prevState => ({
        pipelineStepDict:
          pipelineResults[RESULTS_FOLDER_ROOT_KEY][hostFilteringStageKey],
        loading: prevState.loading.filter(
          section => section !== READ_COUNTS_TABLE
        ),
      }));
    }
  };

  renderReadCountsTable = stepKey => {
    const { pipelineRun } = this.props;
    const { pipelineStepDict } = this.state;
    const { stepsKey } = RESULTS_FOLDER_STAGE_KEYS;
    const {
      stepNameKey,
      readsAfterKey,
      stepDescriptionKey,
    } = RESULTS_FOLDER_STEP_KEYS;

    const step = pipelineStepDict[stepsKey][stepKey];
    const stepName = step[stepNameKey];

    const totalReads = pipelineRun.total_reads;
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

    const percentReads = ((readsAfter / totalReads) * 100).toFixed(2);

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

    const stepDictPresent = Boolean(pipelineStepDict);

    const stepInformationPresent = Object.prototype.hasOwnProperty.call(
      pipelineStepDict,
      "steps"
    );
    if (!stepInformationPresent) {
      return;
    }

    const readsPresent = Object.values(pipelineStepDict["steps"]).reduce(
      (accum, step) => {
        if (step.readsAfter) {
          accum = true;
        }
        return accum;
      },
      false
    );

    return stepDictPresent && stepInformationPresent && readsPresent;
  };

  renderReadsRemainingSection = () => {
    const { stageDescriptionKey, stepsKey } = RESULTS_FOLDER_STAGE_KEYS;
    const { pipelineRun } = this.props;
    const { loading, pipelineStepDict } = this.state;

    if (loading.includes(READ_COUNTS_TABLE)) {
      return (
        <div className={cs.loading}>
          <IconLoading className={cs.loadingIcon} />
          {" Loading"}
        </div>
      );
    }

    if (!pipelineRun || !pipelineRun.total_reads || !this.readsPresent()) {
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
                  Host Filtering Step
                </div>
              }
              content={pipelineStepDict[stageDescriptionKey]}
              title="Host Filtering"
              link={HOST_FILTERING_WIKI}
            />
          </div>
          <div className={cs.narrowMetadataValueContainer}>
            <div className={cs.labelText}>Reads Remaining</div>
          </div>
          <div className={cs.narrowMetadataValueContainer}>
            <div className={cs.labelText}>% Reads Remaining</div>
          </div>
        </div>
        {Object.keys(pipelineStepDict[stepsKey]).map(
          this.renderReadCountsTable
        )}
      </div>
    );
  };

  renderErccComparison = () => {
    const { pipelineRun, erccComparison } = this.props;
    const { graphWidth } = this.state;

    if (!pipelineRun) {
      return (
        <div className={cs.loading}>
          <IconLoading className={cs.loadingIcon} />
          {" Loading"}
        </div>
      );
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
    const {
      pipelineInfo,
      pipelineRun,
      sampleId,
      snapshotShareId,
      erccComparison,
    } = this.props;

    const workflow = get(["workflow", "text"], pipelineInfo);
    const fields =
      workflow === WORKFLOWS.CONSENSUS_GENOME.label
        ? WORKFLOW_INFO_FIELDS
        : PIPELINE_INFO_FIELDS;

    const pipelineInfoFields = fields.map(this.getPipelineInfoField);

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
        {!snapshotShareId && workflow === WORKFLOWS.SHORT_READ_MNGS.label && (
          <React.Fragment>
            <MetadataSection
              toggleable
              onToggle={() => this.toggleSection(READ_COUNTS_TABLE)}
              open={this.state.sectionOpen[READ_COUNTS_TABLE]}
              title="Reads Remaining"
            >
              {this.renderReadsRemainingSection()}
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
                      onClick={() =>
                        logAnalyticsEvent("PipelineTab_download-link_clicked", {
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

PipelineTab.propTypes = {
  pipelineInfo: PropTypes.objectOf(
    PropTypes.shape({
      text: PropTypes.string,
      link: PropTypes.string,
      linkLabel: PropTypes.string,
    })
  ).isRequired,
  sampleId: PropTypes.number.isRequired,
  snapshotShareId: PropTypes.string,
  erccComparison: PropTypes.ERCCComparison,
  pipelineRun: PropTypes.PipelineRun,
};

export default PipelineTab;
