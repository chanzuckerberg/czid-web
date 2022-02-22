import cx from "classnames";
import { Icon, IconButton } from "czifui";
import { sum, find, get, isEmpty } from "lodash/fp";
import React from "react";
import ReactDOM from "react-dom";

import { getCoverageVizData } from "~/api";
import { logAnalyticsEvent, ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { BLAST_FEATURE } from "~/components/utils/features";
import { formatPercent } from "~/components/utils/format";
import PropTypes from "~/components/utils/propTypes";
import { getTooltipStyle } from "~/components/utils/tooltip";
import { getDownloadContigUrl } from "~/components/views/report/utils/download";
import GenomeViz from "~/components/visualizations/GenomeViz";
import Histogram from "~/components/visualizations/Histogram";
import { getTaxonName } from "~/helpers/taxon";
import { TooltipVizTable } from "~ui/containers";
import HelpIcon from "~ui/containers/HelpIcon";
import Sidebar from "~ui/containers/Sidebar";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import { IconLoading, IconArrowRight } from "~ui/icons";
import ImgMicrobePrimary from "~ui/illustrations/ImgMicrobePrimary";
import { openUrl } from "~utils/links";

import HitGroupViz from "./HitGroupViz";
import cs from "./coverage_viz_bottom_sidebar.scss";
import {
  getHistogramTooltipData,
  generateCoverageVizData,
  getSortedAccessionSummaries,
  selectContigsFromHitGroups,
  selectReadsFromHitGroups,
} from "./utils";

// Lighter shade of primary blue.
const READ_FILL_COLOR = "#A9BDFC";
const CONTIG_FILL_COLOR = "#3867FA";
const REF_ACC_COLOR = "#EAEAEA";

const METRIC_COLUMNS = [
  [
    {
      key: "referenceNCBIEntry",
      name: "Reference NCBI Entry",
      tooltip: "The NCBI Genbank entry for the reference accession.",
    },
    {
      key: "referenceLength",
      name: "Reference Length",
      tooltip: "Length in base pairs of the reference accession.",
    },
  ],
  [
    {
      key: "alignedContigs",
      name: "Aligned Contigs",
      tooltip: "Number of contigs for which this accession was the best match.",
    },
    {
      key: "alignedReads",
      name: "Aligned Loose Reads",
      tooltip:
        "Number of reads for which this accession was the best match. Only includes reads which did not assemble into a contig.",
    },
  ],
  [
    {
      key: "coverageDepth",
      name: "Coverage Depth",
      tooltip:
        "The average read depth of aligned contigs and reads over the length of the accession.",
    },
    {
      key: "coverageBreadth",
      name: "Coverage Breadth",
      tooltip:
        "The percentage of the accession that is covered by at least one read or contig.",
    },
  ],
  [
    {
      key: "maxAlignedLength",
      name: "Max Alignment Length",
      tooltip:
        "Length of the longest aligned region over all reads and contigs.",
    },
    {
      key: "avgMismatchedPercent",
      name: "Avg. Mismatched %",
      tooltip:
        "Percentage of aligned regions that are mismatches, averaged over all reads and contigs.",
    },
  ],
];

export default class CoverageVizBottomSidebar extends React.Component {
  _accessionDataCache = {};

  state = {
    currentAccessionSummary: null,
    histogramTooltipLocation: null,
    histogramTooltipData: null,
  };

  componentDidUpdate(prevProps, prevState) {
    const { params, visible } = this.props;
    const { currentAccessionData } = this.state;

    if (
      params.accessionData !== prevProps.params.accessionData &&
      params.accessionData
    ) {
      this.setCurrentAccession(
        get([0, "id"], getSortedAccessionSummaries(params.accessionData)),
      );
    }

    if (
      !prevState.currentAccessionData &&
      currentAccessionData &&
      this.isAccessionDataValid(currentAccessionData)
    ) {
      this.renderHistogram(currentAccessionData);
      this.renderRefAccessionViz(currentAccessionData);
    }

    // Ensure that tooltips are hidden when sidebar closes.
    if (prevProps.visible && !visible) {
      this.setState({
        histogramTooltipLocation: null,
        histogramTooltipData: null,
      });
    }
  }

  getDataForAccession = async accessionId => {
    const { sampleId, snapshotShareId } = this.props;

    if (this._accessionDataCache[accessionId]) {
      return this._accessionDataCache[accessionId];
    } else {
      const data = await getCoverageVizData({
        sampleId,
        accessionId,
        snapshotShareId,
      });
      this._accessionDataCache[accessionId] = data;
      return data;
    }
  };

  loadAccession = async accession => {
    const data = await this.getDataForAccession(accession.id);

    this.setState({
      currentAccessionData: {
        ...data,
        id: accession.id,
      },
    });
  };

  // It's possible that the accessionData failed to load.
  // For example, the coverage viz s3 files couldn't be found.
  // In this case, the accessionData is not valid, and we will display an error message.
  isAccessionDataValid = accessionData => !!accessionData.coverage;

  setCurrentAccession = accessionId => {
    const { params } = this.props;

    const accession = accessionId
      ? find(["id", accessionId], get("best_accessions", params.accessionData))
      : null;

    this.setState({
      currentAccessionSummary: accession,
      currentAccessionData: null,
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
          hoverData[1],
        ),
      });
    }
  };

  handleHistogramBarHover = (clientX, clientY) => {
    this.setState({
      histogramTooltipLocation: {
        left: clientX,
        top: clientY,
      },
    });
  };

  handleHistogramBarExit = () => {
    this.setState({
      histogramTooltipLocation: null,
      histogramTooltipData: null,
    });
  };

  renderHistogram = data => {
    const coverageVizData = generateCoverageVizData(
      data.coverage,
      data.coverage_bin_size,
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
        hoverColors: [CONTIG_FILL_COLOR],
        barOpacity: 1,
        margins: {
          left: 170,
          right: 40,
          top: 30,
          bottom: 30,
        },
        numTicksY: 2,
        labelYHorizontalOffset: 15,
        labelsLarge: true,
        onHistogramBarHover: this.handleHistogramBarHover,
        onHistogramBarEnter: this.handleHistogramBarEnter,
        onHistogramBarExit: this.handleHistogramBarExit,
      },
    );
    this.coverageViz.update();
  };

  renderRefAccessionViz = data => {
    this.refAccesssionViz = new GenomeViz(
      this.refAccessionVizContainer,
      [[0, data.total_length, 0]],
      {
        domain: [0, data.total_length],
        color: REF_ACC_COLOR,
      },
    );
    this.refAccesssionViz.update();
  };

  getAccessionTaxonName = accessionSummary =>
    getTaxonName(
      accessionSummary.taxon_name,
      accessionSummary.taxon_common_name,
      this.props.nameType,
    );

  getAccessionOptions = () => {
    const { params } = this.props;
    return getSortedAccessionSummaries(params.accessionData).map(summary => ({
      value: summary.id,
      text: `${summary.id} - ${summary.name}`,
      customNode: (
        <div className={cs.option}>
          <div className={cs.optionText}>
            {summary.id} - {summary.name}
          </div>
          <div className={cs.optionSubtext}>
            {summary.num_contigs} contigs, {summary.num_reads} reads,{" "}
            {summary.coverage_depth}x coverage depth
            {summary.coverage_breadth
              ? // Converts a float into a percentage. e.g: 0.037 => 3.7%
                `, ${new Intl.NumberFormat("en-US", {
                  style: "percent",
                  maximumFractionDigits: 2,
                }).format(summary.coverage_breadth)} coverage breadth `
              : ""}
          </div>
        </div>
      ),
    }));
  };

  getAccessionMetrics = () => {
    const { sampleId, params } = this.props;
    const { currentAccessionData, currentAccessionSummary } = this.state;

    if (!currentAccessionData) {
      return {};
    }

    const referenceNCBIEntry = (
      <BasicPopup
        trigger={
          <div className={cs.ncbiLinkWrapper}>
            <a
              href={`https://www.ncbi.nlm.nih.gov/nuccore/${currentAccessionSummary.id}?report=genbank`}
              target="_blank"
              rel="noopener noreferrer"
              className={cs.ncbiLink}
              onClick={() =>
                logAnalyticsEvent(
                  "CoverageVizBottomSidebar_ncbi-link_clicked",
                  {
                    accessionId: currentAccessionSummary.id,
                    taxonId: params.taxonId,
                    sampleId,
                  },
                )
              }
            >
              {currentAccessionSummary.id} - {currentAccessionSummary.name}
            </a>
          </div>
        }
        inverted
        content={`${currentAccessionSummary.id} - ${currentAccessionSummary.name}`}
        horizontalOffset={13}
      />
    );

    return {
      referenceNCBIEntry,
      referenceLength: currentAccessionData.total_length,
      alignedContigs: currentAccessionSummary.num_contigs,
      maxAlignedLength: currentAccessionData.max_aligned_length,
      coverageDepth: `${currentAccessionData.coverage_depth}x`,
      coverageBreadth: formatPercent(currentAccessionData.coverage_breadth),
      alignedReads: currentAccessionSummary.num_reads,
      avgMismatchedPercent: formatPercent(
        currentAccessionData.avg_prop_mismatch,
      ),
    };
  };

  renderTaxonLabel = () => {
    const { params } = this.props;
    const { currentAccessionSummary } = this.state;

    const taxonName = getTaxonName(
      params.taxonName,
      params.taxonCommonName,
      this.props.nameType,
    );

    if (params.taxonLevel === "genus" && currentAccessionSummary) {
      const speciesTaxonName = this.getAccessionTaxonName(
        currentAccessionSummary,
      );
      const helpText =
        currentAccessionSummary &&
        `
        The accession being displayed belongs to the species ${speciesTaxonName}, a member of genus ${taxonName}
      `;
      return (
        <div className={cs.taxonLabel}>
          {taxonName} Coverage - {speciesTaxonName}
          <HelpIcon text={helpText} className={cs.helpIcon} />
        </div>
      );
    } else {
      return <div className={cs.taxonLabel}>{taxonName} Coverage</div>;
    }
  };

  renderContentHeader = () => {
    const {
      onBlastClick,
      params,
      pipelineVersion,
      sampleId,
      snapshotShareId,
    } = this.props;
    const { currentAccessionSummary } = this.state;
    const { taxonId, taxonName } = params;

    const { allowedFeatures = [] } = this.context || {};
    const hasBlastFeature = allowedFeatures.includes(BLAST_FEATURE);

    const numBestAccessions = params.accessionData.best_accessions.length;
    const numAccessions = params.accessionData.num_accessions;

    const onlySomeAccessionsShown = numBestAccessions < numAccessions;

    let helpText = `
        ${numAccessions -
          numBestAccessions} poor-quality accessions are omitted, as they have
        no contig alignments and few read alignments.
        To see them, go to the read-level visualization.
      `;

    return (
      <div className={cs.header}>
        <div className={cs.headerText}>
          {this.renderTaxonLabel()}
          <BareDropdown
            options={this.getAccessionOptions()}
            value={get("id", currentAccessionSummary)}
            label="Accession"
            trigger={
              <div className={cs.accessionLabel}>
                {get("id", currentAccessionSummary)} -{" "}
                {get("name", currentAccessionSummary)}
              </div>
            }
            onChange={accessionId => {
              logAnalyticsEvent(
                "CoverageVizBottomSidebar_accession-select_changed",
                {
                  accessionId,
                  taxonId: params.taxonId,
                  sampleId,
                },
              );
              this.setCurrentAccession(accessionId);
            }}
            rounded
            menuClassName={cs.accessionSelectMenu}
          />
          <div className={cs.accessionCountLabel}>
            {numBestAccessions} viewable accessions
            {onlySomeAccessionsShown && (
              <React.Fragment>
                <span className={cs.notShownMsg}>({numAccessions} total)</span>
                <HelpIcon text={helpText} className={cs.helpIcon} />
              </React.Fragment>
            )}
          </div>
        </div>
        <div className={cs.fill} />
        {!snapshotShareId && (
          <div className={cs.headerControls}>
            <div className={cs.vizLinkContainer}>
              <a
                className={cs.linkWithArrow}
                href={params.alignmentVizUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  logAnalyticsEvent(
                    "CoverageVizBottomSidebar_alignment-viz-link_clicked",
                    {
                      accessionId: currentAccessionSummary.id,
                      taxonId: params.taxonId,
                      sampleId,
                    },
                  )
                }
              >
                View read-level visualization
                <IconArrowRight />
              </a>
            </div>
            {hasBlastFeature && (
              <div className={cs.actionIcons}>
                <BasicPopup
                  basic={false}
                  content="BLASTN"
                  position="top center"
                  inverted
                  trigger={
                    <IconButton
                      className={cs.iconButton}
                      onClick={() =>
                        logAnalyticsEvent(
                          ANALYTICS_EVENT_NAMES.COVERAGE_VIZ_BOTTOM_SIDEBAR_BLAST_BUTTON_CLICKED,
                          onBlastClick({
                            pipelineVersion,
                            sampleId,
                            shouldBlastContigs: true,
                            taxName: taxonName,
                            taxId: taxonId,
                          }),
                        )
                      }
                      sdsSize="large"
                      sdsType="secondary"
                    >
                      <Icon
                        sdsIcon="searchLinesHorizontal"
                        sdsSize="xl"
                        sdsType="iconButton"
                      />
                    </IconButton>
                  }
                />
                <BasicPopup
                  basic={false}
                  content="Download Contig FASTA"
                  position="top center"
                  inverted
                  trigger={
                    <IconButton
                      className={cs.iconButton}
                      onClick={() =>
                        logAnalyticsEvent(
                          ANALYTICS_EVENT_NAMES.COVERAGE_VIZ_BOTTOM_SIDEBAR_DOWNLOAD_CONTIG_BUTTON_CLICKED,
                          openUrl(
                            getDownloadContigUrl({
                              pipelineVersion,
                              sampleId,
                              taxId: taxonId,
                            }),
                          ),
                        )
                      }
                      sdsSize="large"
                      sdsType="secondary"
                    >
                      <Icon
                        sdsIcon="download"
                        sdsSize="xl"
                        sdsType="iconButton"
                      />
                    </IconButton>
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  renderContentBody = () => {
    const { currentAccessionData, currentAccessionSummary } = this.state;
    const { pipelineVersion, sampleId, params, snapshotShareId } = this.props;

    if (!currentAccessionData) {
      return (
        <div className={cs.loadingContainer}>
          <div className={cs.loadingMessage}>
            <IconLoading className={cs.loadingIcon} />
            Loading Visualization...
          </div>
        </div>
      );
    }

    if (!this.isAccessionDataValid(currentAccessionData)) {
      return (
        <div className={cs.noDataBody}>
          <div className={cs.noDataContainer}>
            <div className={cs.text}>
              <div className={cs.message}>
                Sorry, we failed to load the coverage data due to an unexpected
                error.
              </div>
              <a
                className={cs.linkWithArrow}
                href="mailto:help@czid.org"
                onClick={() =>
                  logAnalyticsEvent(
                    "CoverageVizBottomSidebar_accession-data-invalid-contact-us_clicked",
                    {
                      accessionId: currentAccessionSummary.id,
                      taxonId: params.taxonId,
                      sampleId,
                    },
                  )
                }
              >
                Contact us for help
                <IconArrowRight />
              </a>
            </div>
            <ImgMicrobePrimary className={cs.icon} />
          </div>
        </div>
      );
    }

    const metrics = this.getAccessionMetrics();
    const contigHitGroups = selectContigsFromHitGroups(
      currentAccessionData.hit_groups,
    );
    const readHitGroups = selectReadsFromHitGroups(
      currentAccessionData.hit_groups,
    );

    const totalContigs = sum(contigHitGroups.map(hitGroup => hitGroup[0]));
    const totalReads = sum(readHitGroups.map(hitGroup => hitGroup[1]));

    return (
      <div className={cx(cs.body, !isEmpty(readHitGroups) && cs.withReads)}>
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
          <BasicPopup
            trigger={
              <a
                className={cx(cs.refAccessionVizLink, cs.genomeViz)}
                href={`https://www.ncbi.nlm.nih.gov/nuccore/${currentAccessionSummary.id}?report=genbank`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  logAnalyticsEvent(
                    "CoverageVizBottomSidebar_ref-accession-viz-link_clicked",
                    {
                      accessionId: currentAccessionSummary.id,
                      taxonId: params.taxonId,
                      sampleId,
                    },
                  )
                }
              >
                <div
                  className={cs.genomeVizInner}
                  ref={refAccessionVizContainer => {
                    this.refAccessionVizContainer = refAccessionVizContainer;
                  }}
                />
              </a>
            }
            inverted
            wide="very"
            content={currentAccessionSummary.name}
          />
        </div>
        <HitGroupViz
          accessionData={currentAccessionData}
          color={CONTIG_FILL_COLOR}
          hitGroups={contigHitGroups}
          key="contigHitGroupViz"
          label={`Contigs (${totalContigs})`}
          pipelineVersion={pipelineVersion}
          sampleId={sampleId}
          snapshotShareId={snapshotShareId}
          taxonId={params.taxonId}
        />
        {!isEmpty(readHitGroups) && (
          <HitGroupViz
            key="readHitGroupViz"
            label={`Loose Reads (${totalReads})`}
            color={READ_FILL_COLOR}
            accessionData={currentAccessionData}
            hitGroups={readHitGroups}
            taxonId={params.taxonId}
            sampleId={sampleId}
            pipelineVersion={pipelineVersion}
          />
        )}
      </div>
    );
  };

  renderSidebarContents() {
    const { histogramTooltipLocation, histogramTooltipData } = this.state;

    return (
      <NarrowContainer className={cs.contents}>
        {this.renderContentHeader()}
        {this.renderContentBody()}
        {histogramTooltipLocation &&
          histogramTooltipData &&
          ReactDOM.createPortal(
            <div
              style={getTooltipStyle(histogramTooltipLocation)}
              className={cs.hoverTooltip}
            >
              <TooltipVizTable data={histogramTooltipData} />
            </div>,
            document.body,
          )}
      </NarrowContainer>
    );
  }

  renderNoDataContents() {
    const { params, sampleId, snapshotShareId } = this.props;

    return (
      <NarrowContainer className={cs.contents}>
        <div className={cs.header}>
          <div className={cs.headerText}>{this.renderTaxonLabel()}</div>
          <div className={cs.fill} />
        </div>
        <div className={cs.noDataBody}>
          <div className={cs.noDataContainer}>
            <div className={cs.text}>
              <div className={cs.message}>
                Sorry, the coverage visualization is only available for taxons
                with at least one assembled contig in NT.
              </div>
              {!snapshotShareId && (
                <a
                  className={cs.linkWithArrow}
                  href={params.alignmentVizUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    logAnalyticsEvent(
                      "CoverageVizBottomSidebar_no-data-alignment-viz-link_clicked",
                      {
                        taxonId: params.taxonId,
                        sampleId,
                      },
                    )
                  }
                >
                  View read-level visualization
                  <IconArrowRight />
                </a>
              )}
            </div>
            <ImgMicrobePrimary className={cs.icon} />
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
        {get("accessionData.best_accessions", params) &&
        params.accessionData.best_accessions.length > 0
          ? this.renderSidebarContents()
          : this.renderNoDataContents()}
      </Sidebar>
    );
  }
}

CoverageVizBottomSidebar.propTypes = {
  visible: PropTypes.bool,
  onBlastClick: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  params: PropTypes.shape({
    taxonId: PropTypes.number,
    taxonName: PropTypes.string,
    taxonCommonName: PropTypes.string,
    taxonLevel: PropTypes.string,
    accessionData: PropTypes.shape({
      best_accessions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          num_contigs: PropTypes.number,
          num_reads: PropTypes.number,
          name: PropTypes.string,
          score: PropTypes.number,
          coverage_depth: PropTypes.number,
          taxon_name: PropTypes.string,
          taxon_common_name: PropTypes.string,
        }),
      ),
      num_accessions: PropTypes.number,
    }),
    // Link to the old alignment viz.
    alignmentVizUrl: PropTypes.string,
  }),
  sampleId: PropTypes.number,
  pipelineVersion: PropTypes.string,
  nameType: PropTypes.string,
  snapshotShareId: PropTypes.string,
};

CoverageVizBottomSidebar.contextType = UserContext;
