import React from "react";
import { isEmpty, set } from "lodash/fp";
import cx from "classnames";

import ERCCScatterPlot from "~/components/ERCCScatterPlot";
import PropTypes from "~/components/utils/propTypes";
import { humanize } from "~/helpers/strings";
import { getDownloadLinks } from "~/components/views/report/utils/download";
import { logAnalyticsEvent } from "~/api/analytics";
import { getSamplePipelineResults } from "~/api";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import FieldList from "~/components/common/DetailsSidebar/FieldList";

import { PIPELINE_INFO_FIELDS, HOST_FILTERING_WIKI } from "./constants";
import MetadataSection from "./MetadataSection";
import cs from "./sample_details_mode.scss";

const NCOV_PUBLIC_SITE = true;

class PipelineTab extends React.Component {
  state = {
    sectionOpen: {
      pipelineInfo: true,
      readsRemaining: false,
      erccScatterplot: false,
      downloads: false,
    },
    sectionEditing: {},
    graphWidth: 0,
    pipelineStepDict: {},
  };

  componentDidMount() {
    this.updateGraphDimensions();
    this.getReadCounts();
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
    const { pipelineInfo } = this.props;
    const { text, linkLabel, link } = pipelineInfo[field.key] || {};

    const metadataLink = linkLabel &&
      link && (
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

    if (pipelineResults && pipelineResults["displayed_data"]) {
      this.setState({
        pipelineStepDict: pipelineResults["displayed_data"]["Host Filtering"],
      });
    }
  };

  renderReadCountsTable = stepKey => {
    // Humanize step name and remove "_out",
    // e.g. "validate_input_out" -> "Validate Input"
    let stepName = humanize(stepKey).slice(0, -4);
    let step = this.state.pipelineStepDict["steps"][stepKey];

    const totalReads = this.props.pipelineRun.total_reads;
    let readsAfter = step["reads_after"];

    // Special case cdhitdup. All steps after cdhitdup transform their counts by
    // in the pipeline by the compression ratio to return nonunique reads.
    let uniqueReads = null;
    if (
      stepKey === "cdhitdup_out" &&
      this.props.pipelineRun.pipeline_version > "4"
    ) {
      const previousStep = this.state.pipelineStepDict["steps"]["priceseq_out"];
      uniqueReads = readsAfter;
      readsAfter = previousStep["reads_after"];
    }

    let percentReads = (readsAfter / totalReads * 100).toFixed(2);

    return (
      <div className={cs.readsRemainingRow}>
        <div className={cs.label}>
          <ColumnHeaderTooltip
            position="top left"
            trigger={<div className={cs.labelText}>{stepName}</div>}
            content={step["step_description"]}
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

  render() {
    const { pipelineRun, sampleId } = this.props;
    const pipelineInfoFields = PIPELINE_INFO_FIELDS.map(
      this.getPipelineInfoField
    );

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
        <MetadataSection
          toggleable
          onToggle={() => this.toggleSection("readsRemaining")}
          open={this.state.sectionOpen.readsRemaining}
          title="Reads Remaining"
        >
          {!pipelineRun ||
          !pipelineRun.total_reads ||
          isEmpty(this.state.pipelineStepDict) ||
          isEmpty(this.state.pipelineStepDict["steps"]) ? (
            <div className={cs.noData}>No data</div>
          ) : (
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
                    content={this.state.pipelineStepDict["stage_description"]}
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
              {Object.keys(this.state.pipelineStepDict["steps"]).map(
                this.renderReadCountsTable
              )}
            </div>
          )}
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
            <ERCCScatterPlot
              ercc_comparison={this.props.erccComparison}
              width={this.state.graphWidth}
              height={0.7 * this.state.graphWidth}
            />
          </div>
        </MetadataSection>
        {!NCOV_PUBLIC_SITE && (
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
  erccComparison: PropTypes.ERCCComparison,
  pipelineRun: PropTypes.PipelineRun,
};

export default PipelineTab;
