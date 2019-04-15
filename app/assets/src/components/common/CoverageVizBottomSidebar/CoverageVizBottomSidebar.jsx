import React from "react";
import { find, get } from "lodash/fp";
import cx from "classnames";
import ReactDOM from "react-dom";

import Sidebar from "~/components/ui/containers/Sidebar";
import PropTypes from "~/components/utils/propTypes";
import Histogram from "~/components/visualizations/Histogram";
import GenomeViz from "~/components/visualizations/GenomeViz";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import LoadingIcon from "~ui/icons/LoadingIcon";
import BasicPopup from "~/components/BasicPopup";
import NarrowContainer from "~/components/layout/NarrowContainer";
import NoResultsBacteriaIcon from "~ui/icons/NoResultsBacteriaIcon";
import { DataTooltip } from "~ui/containers";

import {
  getHistogramTooltipData,
  getGenomeVizTooltipData,
  generateCoverageVizData,
  generateContigReadVizData
} from "./utils";
import cs from "./coverage_viz_bottom_sidebar.scss";

// Temporary data.
// TODO(mark): Fetch data from the server.
import CUTI_ACCESSION_ONE from "./temporary_data/CP012352.1_coverage_viz.json";
import CUTI_ACCESSION_TWO from "./temporary_data/CP012647.1_coverage_viz.json";
import CUTI_ACCESSION_THREE from "./temporary_data/AE017283.1_coverage_viz.json";
import CUTI_ACCESSION_FOUR from "./temporary_data/CP012350.1_coverage_viz.json";

const ACCESSION_COVERAGE_DATA = {
  "CP012352.1": CUTI_ACCESSION_ONE,
  "CP012647.1": CUTI_ACCESSION_TWO,
  "AE017283.1": CUTI_ACCESSION_THREE,
  "CP012350.1": CUTI_ACCESSION_FOUR
};

const READ_FILL_COLOR = "#A9BDFC";
const CONTIG_FILL_COLOR = "#3768FA";

const METRIC_COLUMNS = [
  [
    {
      key: "referenceAccession",
      name: "Reference Accession",
      tooltip: "The reference accession name from GenBank."
    },
    {
      key: "referenceLength",
      name: "Reference Length",
      tooltip: "Length in bp of the reference accession sequence."
    }
  ],
  [
    {
      key: "alignedContigs",
      name: "Aligned Contigs",
      tooltip: "Number of contigs for which this accession was the best match."
    },
    {
      key: "maxAlignedLength",
      name: "Max Aligned Length",
      tooltip:
        "Length of the longest aligned region over all reads and contigs."
    }
  ],
  [
    {
      key: "avgCoverageDepth",
      name: "Avg. Coverage Depth",
      tooltip:
        "The total length of all aligned contigs and reads, divided by the accession length."
    },
    {
      key: "coverageBreadth",
      name: "Coverage Breadth",
      tooltip:
        "The percentage of the accession that is covered by at least one read or contig."
    }
  ],
  [
    {
      key: "alignedReads",
      name: "Aligned Reads",
      tooltip: "Number of reads for which this accession was the best match."
    },
    {
      key: "avgMismatchedPercent",
      name: "Avg. Mismatched %",
      tooltip:
        "Percentage of aligned regions that are mismatches, averaged over all reads and contigs."
    }
  ]
];

export default class CoverageVizBottomSidebar extends React.Component {
  _accessionDataCache = {};

  state = {
    currentAccessionSummary: null,
    histogramTooltipLocation: null,
    histogramTooltipData: null,
    genomeVizTooltipData: null,
    genomeVizTooltipLocation: null
  };

  componentDidUpdate(prevProps, prevState) {
    const { params } = this.props;
    const { currentAccessionData } = this.state;

    // TODO(mark): Select the best accessionSummary by score.
    if (params.accessionSummaries !== prevProps.params.accessionSummaries) {
      this.setCurrentAccession(get([2, "id"], params.accessionSummaries));
    }

    if (!prevState.currentAccessionData && currentAccessionData) {
      this.renderHistogram(currentAccessionData);
      this.renderGenomeViz(currentAccessionData);
    }
  }

  getDataForAccession = async accessionId => {
    if (this._accessionDataCache[accessionId]) {
      return this._accessionDataCache[accessionId];
    } else {
      // Replace with network fetch.
      const data = ACCESSION_COVERAGE_DATA[accessionId];

      this._accessionDataCache[accessionId] = data;
      return data;
    }
  };

  loadAccession = async accession => {
    const data = await this.getDataForAccession(accession.id);

    this.setState({
      currentAccessionData: data
    });
  };

  setCurrentAccession = accessionId => {
    const { params } = this.props;

    const accession = accessionId
      ? find(["id", accessionId], params.accessionSummaries)
      : null;

    this.setState({
      currentAccessionSummary: accession,
      currentAccessionData: null
    });

    if (accession) {
      this.loadAccession(accession);
    }
  };

  handleHistogramBarEnter = hoverData => {
    const { currentAccessionData } = this.state;

    if (hoverData && hoverData[0] === 0) {
      this.setState({
        histogramTooltipData: getHistogramTooltipData(
          currentAccessionData,
          hoverData[1]
        )
      });
    }
  };

  handleHistogramBarHover = (pageX, pageY) => {
    this.setState({
      histogramTooltipLocation: {
        left: pageX,
        top: pageY
      }
    });
  };

  handleHistogramBarExit = () => {
    this.setState({
      histogramTooltipLocation: null,
      histogramTooltipData: null
    });
  };

  handleGenomeVizBarEnter = hoverData => {
    const { currentAccessionData } = this.state;

    if (hoverData !== null) {
      this.setState({
        genomeVizTooltipData: getGenomeVizTooltipData(
          currentAccessionData,
          hoverData
        )
      });
    }
  };

  handleGenomeVizBarHover = (pageX, pageY) => {
    this.setState({
      genomeVizTooltipLocation: {
        left: pageX,
        top: pageY
      }
    });
  };

  handleGenomeVizBarExit = () => {
    this.setState({
      genomeVizTooltipLocation: null,
      genomeVizTooltipData: null
    });
  };

  renderHistogram = data => {
    const coverageVizData = generateCoverageVizData(
      data.coverage,
      data.coverage_bin_size
    );

    this.coverageViz = new Histogram(
      this.coverageVizContainer,
      [coverageVizData],
      {
        labelY: "Coverage",
        domain: [0, data.total_length],
        skipBins: true,
        numBins: Math.round(data.total_length / data.coverage_bin_size),
        showStatistics: false,
        colors: [READ_FILL_COLOR],
        barOpacity: 1,
        margins: {
          left: 170,
          right: 40,
          top: 30,
          bottom: 30
        },
        numTicksY: 2,
        labelYOffset: 15,
        labelYLarge: true,
        onHistogramBarHover: this.handleHistogramBarHover,
        onHistogramBarEnter: this.handleHistogramBarEnter,
        onHistogramBarExit: this.handleHistogramBarExit
      }
    );
    this.coverageViz.update();
  };

  renderGenomeViz = data => {
    const contigReadVizData = generateContigReadVizData(
      data.hit_groups,
      data.coverage_bin_size
    );

    this.contigReadViz = new GenomeViz(
      this.contigReadVizContainer,
      contigReadVizData,
      {
        domain: [0, data.total_length],
        colors: [READ_FILL_COLOR, CONTIG_FILL_COLOR],
        onGenomeVizBarHover: this.handleGenomeVizBarHover,
        onGenomeVizBarEnter: this.handleGenomeVizBarEnter,
        onGenomeVizBarExit: this.handleGenomeVizBarExit
      }
    );
    this.contigReadViz.update();
  };

  getAccessionOptions = () => {
    const { params } = this.props;
    return params.accessionSummaries.map(summary => ({
      text: summary.id,
      value: summary.id
    }));
  };

  getAccessionMetrics = () => {
    const { currentAccessionData, currentAccessionSummary } = this.state;

    if (!currentAccessionData) {
      return {};
    }

    const referenceAccession = (
      <BasicPopup
        trigger={
          <div className={cs.ncbiLinkWrapper}>
            <a
              href={`https://www.ncbi.nlm.nih.gov/nuccore/${
                currentAccessionSummary.id
              }?report=genbank`}
              target="_blank"
              rel="noopener noreferrer"
              className={cs.ncbiLink}
            >
              {currentAccessionSummary.name}
            </a>
          </div>
        }
        inverted
        content={currentAccessionSummary.name}
        horizontalOffset={13}
      />
    );

    return {
      referenceAccession,
      referenceLength: currentAccessionData.total_length,
      alignedContigs: currentAccessionSummary.num_contigs,
      maxAlignedLength: currentAccessionData.max_aligned_length,
      avgCoverageDepth: currentAccessionData.avg_coverage_depth,
      coverageBreadth: currentAccessionData.coverage_breadth,
      alignedReads: currentAccessionSummary.num_reads,
      avgMismatchedPercent: currentAccessionData.avg_prop_mismatch
    };
  };

  renderContentHeader = () => {
    const { params } = this.props;
    const { currentAccessionSummary } = this.state;

    return (
      <div className={cs.header}>
        <div className={cs.headerText}>
          <div className={cs.title}>{params.taxonName} Coverage</div>
          <div className={cs.subtitle}>
            {params.accessionSummaries.length} unique accessions
          </div>
        </div>
        <div className={cs.fill} />
        <div className={cs.headerControls}>
          <Dropdown
            options={this.getAccessionOptions()}
            value={get("id", currentAccessionSummary)}
            label="Accession"
            onChange={this.setCurrentAccession}
            rounded
          />
          <div className={cs.vizLinkContainer}>
            <a
              className={cs.vizLink}
              href={params.alignmentVizUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View read-level visualization
              <i className={cx("fa fa-chevron-right", cs.rightArrow)} />
            </a>
          </div>
        </div>
      </div>
    );
  };

  renderContentBody = () => {
    const { currentAccessionData } = this.state;

    if (!currentAccessionData) {
      return (
        <div className={cs.loadingContainer}>
          <div className={cs.loadingMessage}>
            <LoadingIcon className={cs.loadingIcon} />Loading Visualization...
          </div>
        </div>
      );
    }

    const metrics = this.getAccessionMetrics();

    return (
      <div className={cs.body}>
        <div className={cs.metrics}>
          {METRIC_COLUMNS.map((col, index) => (
            <div className={cs.column} key={index}>
              {col.map(metric => (
                <div className={cs.metric} key={metric.key}>
                  <div className={cs.label}>
                    <BasicPopup
                      trigger={<div>{metric.name}</div>}
                      inverted
                      content={metric.tooltip}
                      horizontalOffset={13}
                    />
                  </div>
                  <div className={cs.value}>{metrics[metric.key]}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div
          className={cs.coverageVizHistogram}
          ref={coverageVizContainer => {
            this.coverageVizContainer = coverageVizContainer;
          }}
        />
        <div className={cs.genomeVizRow}>
          <div className={cs.rowLabel}>Reference Accession</div>
          <div className={cx(cs.genomeViz, cs.referenceAccession)} />
        </div>
        <div className={cs.genomeVizRow}>
          <div className={cs.rowLabel}>Contigs and Reads</div>
          <div
            className={cs.genomeViz}
            ref={contigReadVizContainer => {
              this.contigReadVizContainer = contigReadVizContainer;
            }}
          />
        </div>
      </div>
    );
  };

  renderSidebarContents() {
    const {
      histogramTooltipLocation,
      histogramTooltipData,
      genomeVizTooltipLocation,
      genomeVizTooltipData
    } = this.state;

    return (
      <NarrowContainer className={cs.contents}>
        {this.renderContentHeader()}
        {this.renderContentBody()}
        {histogramTooltipLocation &&
          histogramTooltipData &&
          ReactDOM.createPortal(
            <div
              style={{
                left: histogramTooltipLocation.left + 10,
                top: histogramTooltipLocation.top - 10
              }}
              className={cs.hoverTooltip}
            >
              <DataTooltip data={histogramTooltipData} />
            </div>,
            document.body
          )}
        {genomeVizTooltipLocation &&
          genomeVizTooltipData &&
          ReactDOM.createPortal(
            <div
              style={{
                left: genomeVizTooltipLocation.left + 10,
                top: genomeVizTooltipLocation.top - 10
              }}
              className={cs.hoverTooltip}
            >
              <DataTooltip data={genomeVizTooltipData} />
            </div>,
            document.body
          )}
      </NarrowContainer>
    );
  }

  renderNoDataContents() {
    const { params } = this.props;

    return (
      <NarrowContainer className={cs.contents}>
        <div className={cs.header}>
          <div className={cs.headerText}>
            <div className={cs.title}>{params.taxonName} Coverage</div>
          </div>
          <div className={cs.fill} />
        </div>
        <div className={cs.noDataBody}>
          <div className={cs.noDataContainer}>
            <div className={cs.text}>
              <div className={cs.message}>
                Sorry, the coverage visualization is currently available for
                species level taxons with at least one assembled contig in NT.
              </div>
              <a
                className={cs.vizLink}
                href={params.alignmentVizUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View read-level visualization
                <i className={cx("fa fa-chevron-right", cs.rightArrow)} />
              </a>
            </div>
            <NoResultsBacteriaIcon className={cs.icon} />
          </div>
        </div>
      </NarrowContainer>
    );
  }

  render() {
    const { visible, onClose, params } = this.props;

    return (
      <Sidebar
        visible={visible}
        width="very wide"
        onClose={onClose}
        direction="bottom"
      >
        {params.accessionSummaries && params.accessionSummaries.length > 0
          ? this.renderSidebarContents()
          : this.renderNoDataContents()}
      </Sidebar>
    );
  }
}

CoverageVizBottomSidebar.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  params: PropTypes.shape({
    taxonId: PropTypes.string,
    taxonName: PropTypes.string,
    accessionSummaries: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        num_contigs: PropTypes.number,
        num_reads: PropTypes.number,
        name: PropTypes.string
      })
    ),
    // Link to the old alignment viz.
    alignmentVizUrl: PropTypes.string
  })
};
