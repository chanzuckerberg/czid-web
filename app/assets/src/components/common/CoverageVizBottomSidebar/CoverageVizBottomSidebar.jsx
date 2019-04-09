import React from "react";
import { min, max, find, get } from "lodash/fp";
import cx from "classnames";

import Sidebar from "~/components/ui/containers/Sidebar";
import PropTypes from "~/components/utils/propTypes";
import Histogram from "~/components/visualizations/Histogram";
import GenomeViz from "~/components/visualizations/GenomeViz";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import LoadingIcon from "~ui/icons/LoadingIcon";
import BasicPopup from "~/components/BasicPopup";
import NarrowContainer from "~/components/layout/NarrowContainer";

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

const METRIC_COLUMNS = [
  [
    {
      key: "referenceAccession",
      name: "Reference Accession",
      tooltip: "Genbank Accession ID for the reference accession."
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

const alignRange = range => [min(range), max(range)];

export default class CoverageVizBottomSidebar extends React.Component {
  _accessionDataCache = {};

  state = {
    currentAccessionSummary: null
  };

  componentDidUpdate(prevProps, prevState) {
    const { visible, params } = this.props;
    const { currentAccessionData } = this.state;

    if (!prevProps.visible && visible) {
      this.setCurrentAccession(params.accessionSummaries[2].id);
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

    const accession = find(["id", accessionId], params.accessionSummaries);

    this.setState({
      currentAccessionSummary: accession,
      currentAccessionData: null
    });
    this.loadAccession(accession);
  };

  generateCoverageVizData = (coverageData, coverageBinSize) =>
    coverageData.map((value, index) => ({
      x0: index * coverageBinSize,
      length: value
    }));

  generateContigReadVizData = (contigs, reads) => {
    return [
      contigs.map(contig => alignRange([contig[1], contig[2]])),
      reads.map(read => alignRange([read[1], read[2]]))
    ];
  };

  renderHistogram = data => {
    const coverageVizData = this.generateCoverageVizData(
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
        showStatistics: false,
        colors: ["#A9BDFC"],
        barOpacity: 1,
        margins: {
          left: 170,
          right: 40,
          top: 30,
          bottom: 30
        },
        numTicksY: 2,
        labelYOffset: 15,
        labelYLarge: true
      }
    );
    this.coverageViz.update();
  };

  renderGenomeViz = data => {
    const contigReadVizData = this.generateContigReadVizData(
      data.contigs,
      data.reads
    );

    this.contigReadViz = new GenomeViz(
      this.contigReadVizContainer,
      contigReadVizData,
      {
        domain: [0, data.total_length]
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
          <a
            href={`https://www.ncbi.nlm.nih.gov/nuccore/${
              currentAccessionSummary.id
            }?report=genbank`}
            target="_blank"
            rel="noopener noreferrer"
            className={cs.ncbiLink}
          >
            {currentAccessionSummary.id}
          </a>
        }
        inverted
        content={currentAccessionSummary.name}
        horizontalOffset={13}
      />
    );

    return {
      referenceAccession,
      referenceLength: currentAccessionData.total_length,
      alignedContigs: currentAccessionSummary.n_contig,
      maxAlignedLength: "--",
      avgCoverageDepth: "--",
      coverageBreadth: "--",
      alignedReads: currentAccessionSummary.n_read,
      avgMismatchedPercent: "--"
    };
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
        <div className={cs.stats}>
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
    const { params } = this.props;
    const { currentAccessionSummary } = this.state;

    return (
      <NarrowContainer className={cs.contents}>
        <div className={cs.header}>
          <div className={cs.headerText}>
            <div className={cs.title}>Coverage for {params.taxonName}</div>
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
                View old visualization {">"}
              </a>
            </div>
          </div>
        </div>
        {this.renderContentBody()}
      </NarrowContainer>
    );
  }

  render() {
    const { visible, onClose } = this.props;

    return (
      <Sidebar
        visible={visible}
        width="very wide"
        onClose={onClose}
        direction="bottom"
      >
        {this.renderSidebarContents()}
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
        n_contig: PropTypes.number,
        n_read: PropTypes.number,
        name: PropTypes.string
      })
    ),
    // Link to the old alignment viz.
    alignmentVizUrl: PropTypes.string
  })
};
