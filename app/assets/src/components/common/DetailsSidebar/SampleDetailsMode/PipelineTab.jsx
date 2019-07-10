import React from "react";
import { set } from "lodash/fp";
import cx from "classnames";

import ERCCScatterPlot from "~/components/ERCCScatterPlot";
import PropTypes from "~/components/utils/propTypes";
import { getDownloadLinks } from "~/components/views/report/utils/download";
import { logAnalyticsEvent } from "~/api/analytics";

import { PIPELINE_INFO_FIELDS } from "./constants";
import MetadataSection from "./MetadataSection";
import cs from "./sample_details_mode.scss";

class PipelineTab extends React.Component {
  state = {
    sectionOpen: {
      pipelineInfo: true,
      erccScatterplot: false,
      downloads: false,
    },
    sectionEditing: {},
    graphWidth: 0,
  };

  componentDidMount() {
    this.updateGraphDimensions();
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

  renderPipelineInfoField = field => {
    const { pipelineInfo } = this.props;
    const { text, linkLabel, link } = pipelineInfo[field.key];

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

    return (
      <div className={cs.field} key={field.key}>
        <div className={cs.label}>{field.name}</div>
        {text === undefined || text === null || text === "" ? (
          <div className={cs.emptyValue}>--</div>
        ) : (
          <div className={cs.metadataValue}>
            {text}
            {metadataLink}
          </div>
        )}
      </div>
    );
  };

  render() {
    const { pipelineRun, sampleId, showPipelineVizLink } = this.props;
    return (
      <div>
        <MetadataSection
          toggleable
          onToggle={() => this.toggleSection("pipelineInfo")}
          open={this.state.sectionOpen.pipelineInfo}
          title="Pipeline Info"
        >
          {PIPELINE_INFO_FIELDS.map(this.renderPipelineInfoField)}
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
        <MetadataSection
          toggleable
          onToggle={() => this.toggleSection("downloads")}
          open={this.state.sectionOpen.downloads}
          title="Downloads"
        >
          <div className={cs.downloadSectionContent}>
            {pipelineRun &&
              getDownloadLinks(sampleId, pipelineRun, showPipelineVizLink).map(
                option => (
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
                )
              )}
          </div>
        </MetadataSection>
      </div>
    );
  }
}

PipelineTab.propTypes = {
  pipelineInfo: PropTypes.objectOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      link: PropTypes.string,
      linkLabel: PropTypes.string,
    })
  ).isRequired,
  sampleId: PropTypes.number.isRequired,
  erccComparison: PropTypes.ERCCComparison,
  pipelineRun: PropTypes.PipelineRun,
  showPipelineVizLink: PropTypes.bool,
};

export default PipelineTab;
