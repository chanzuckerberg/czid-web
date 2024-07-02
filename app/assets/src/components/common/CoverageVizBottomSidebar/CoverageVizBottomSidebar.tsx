/* eslint-disable import/order */
import { ButtonIcon, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import { find, get, isEmpty, sum } from "lodash/fp";
import React from "react";
import ReactDOM from "react-dom";
// Helper Functions and Constants
import { getCoverageVizData } from "~/api";
// Components
import BasicPopup from "~/components/common/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import { getDownloadContigUrl } from "~/components/utils/download";
import { formatPercent } from "~/components/utils/format";
import { getTooltipStyle } from "~/components/utils/tooltip";
import GenomeViz from "~/components/visualizations/GenomeViz";
import Histogram from "~/components/visualizations/Histogram";
import { getTaxonName } from "~/helpers/taxon";
import { GenomeVizShape, HistogramShape } from "~/interface/shared";
import { TooltipVizTable } from "~ui/containers";
import HelpIcon from "~ui/containers/HelpIcon";
import Sidebar from "~ui/containers/Sidebar";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import { IconArrowRight } from "~ui/icons";
import ImgMicrobePrimary from "~ui/illustrations/ImgMicrobePrimary";
import { openUrl } from "~utils/links";
import LoadingMessage from "../LoadingMessage";
import {
  BLAST_NOT_AVAILABLE,
  CONTIG_FILL_COLOR,
  METRIC_COLUMNS,
  READ_FILL_COLOR,
  REF_ACC_COLOR,
} from "./constants";
// Types and Styles
import cs from "./coverage_viz_bottom_sidebar.scss";
import HitGroupViz from "./HitGroupViz";
import {
  AccessionsData,
  AccessionsSummary,
  CoverageVizBottomSidebarProps,
  CoverageVizBottomSidebarsState,
} from "./types";
import {
  generateCoverageVizData,
  getHistogramTooltipData,
  getSortedAccessionSummaries,
  selectContigsFromHitGroups,
  selectReadsFromHitGroups,
} from "./utils";
import { CoverageVizBottomSidebarConfig } from "./workflowTypeConfig";

export default class CoverageVizBottomSidebar extends React.Component<
  CoverageVizBottomSidebarProps,
  CoverageVizBottomSidebarsState
> {
  _accessionDataCache = {};
  private coverageViz: HistogramShape;
  private coverageVizContainer: HTMLDivElement;
  private refAccessionVizContainer: HTMLDivElement;
  private refAccesssionViz: GenomeVizShape;

  state: CoverageVizBottomSidebarsState = {
    currentAccessionSummary: null,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    histogramTooltipLocation: null,
    histogramTooltipData: null,
  };

  componentDidUpdate(
    prevProps: CoverageVizBottomSidebarProps,
    prevState: CoverageVizBottomSidebarsState,
  ) {
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        histogramTooltipLocation: null,
        histogramTooltipData: null,
      });
    }
  }

  getDataForAccession = async (accessionId: string) => {
    const { sampleId, snapshotShareId, pipelineVersion } = this.props;

    if (this._accessionDataCache[accessionId]) {
      return this._accessionDataCache[accessionId];
    } else {
      const data = await getCoverageVizData({
        sampleId: sampleId.toString(),
        accessionId,
        snapshotShareId,
        pipelineVersion,
      });
      this._accessionDataCache[accessionId] = data;
      return data;
    }
  };

  loadAccession = async (accession: AccessionsSummary) => {
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
  isAccessionDataValid = (accessionData: AccessionsData): boolean =>
    !!accessionData.coverage;

  setCurrentAccession = (accessionId: string): void => {
    const { params } = this.props;

    const accession = accessionId
      ? find(["id", accessionId], get("best_accessions", params.accessionData))
      : null;

    this.setState({
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      currentAccessionSummary: accession,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      currentAccessionData: null,
    });

    if (accession) {
      this.loadAccession(accession);
    }
  };

  handleHistogramBarEnter = (hoverData: [number, number]) => {
    const { currentAccessionData } = this.state;

    if (hoverData && hoverData[0] === 0) {
      this.setState({
        histogramTooltipData: getHistogramTooltipData(
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          currentAccessionData,
          hoverData[1],
        ),
      });
    }
  };

  handleHistogramBarHover = (clientX: number, clientY: number): void => {
    this.setState({
      histogramTooltipLocation: {
        left: clientX,
        top: clientY,
      },
    });
  };

  handleHistogramBarExit = () => {
    this.setState({
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      histogramTooltipLocation: null,
      histogramTooltipData: null,
    });
  };

  renderHistogram = (data: AccessionsData) => {
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

  renderRefAccessionViz = (data: AccessionsData) => {
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

  getAccessionTaxonName = (accessionSummary: AccessionsSummary): string =>
    getTaxonName(
      accessionSummary.taxon_name,
      accessionSummary.taxon_common_name,
      this.props.nameType,
    );

  getAccessionOptions = (): {
    value: string;
    text: string;
    customNode: JSX.Element;
  }[] => {
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

  getAccessionMetrics = (
    alignedReads: number,
  ): {
    referenceNCBIEntry?: JSX.Element;
    referenceLength?: number;
    alignedContigs?: number;
    maxAlignedLength?: number;
    coverageDepth?: string;
    coverageBreadth?: string;
    alignedReads?: number;
    avgMismatchedPercent?: string;
  } => {
    const { currentAccessionData, currentAccessionSummary } = this.state;

    if (!currentAccessionData) {
      return {};
    }

    const referenceNCBIEntry = (
      <BasicPopup
        trigger={
          <div className={cs.ncbiLinkWrapper}>
            <a
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
              href={`https://www.ncbi.nlm.nih.gov/nuccore/${currentAccessionSummary.id}?report=genbank`}
              target="_blank"
              rel="noopener noreferrer"
              className={cs.ncbiLink}
            >
              {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531 */}
              {currentAccessionSummary.id} - {currentAccessionSummary.name}
            </a>
          </div>
        }
        inverted
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        content={`${currentAccessionSummary.id} - ${currentAccessionSummary.name}`}
        horizontalOffset={13}
      />
    );

    return {
      referenceNCBIEntry,
      referenceLength: currentAccessionData.total_length,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      alignedContigs: currentAccessionSummary.num_contigs,
      maxAlignedLength: currentAccessionData.max_aligned_length,
      coverageDepth: `${currentAccessionData.coverage_depth}x`,
      coverageBreadth: formatPercent(currentAccessionData.coverage_breadth),
      alignedReads: alignedReads,
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
      const helpText = `
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

  renderBlastAction = () => {
    const { onBlastClick, params, pipelineVersion, sampleId } = this.props;
    const { taxonId, taxonName, taxonStatsByCountType } = params;

    // BLAST is not available unless the taxon has >=1 NT contigs
    const blastDisabled = !taxonStatsByCountType.ntContigs;
    return (
      <Tooltip
        className={cs.actionIconPopup}
        arrow
        placement="top"
        sdsStyle={blastDisabled ? "light" : "dark"}
        title={blastDisabled ? BLAST_NOT_AVAILABLE : "BLAST"}
      >
        <span>
          <ButtonIcon
            className={cs.iconButton}
            disabled={blastDisabled}
            onClick={() =>
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
              onBlastClick({
                context: {
                  blastedFrom: "CoverageVizBottomSidebar",
                },
                pipelineVersion,
                sampleId,
                taxName: taxonName,
                taxId: taxonId,
                // shouldBlastContigs is only used by Blast V0 and will be removed after Blast V1 is launched
                shouldBlastContigs: true,
                taxonStatsByCountType,
              })
            }
            sdsSize="large"
            sdsType="secondary"
            sdsIcon="searchLinesHorizontal"
          />
        </span>
      </Tooltip>
    );
  };

  renderContentHeader = () => {
    const { params, pipelineVersion, sampleId, snapshotShareId, workflow } =
      this.props;
    const { currentAccessionSummary } = this.state;
    const { taxonId } = params;

    const numBestAccessions = params.accessionData.best_accessions.length;
    const numAccessions = params.accessionData.num_accessions;

    const onlySomeAccessionsShown = numBestAccessions < numAccessions;

    const helpText = `
        ${
          numAccessions - numBestAccessions
        } poor-quality accessions are omitted, as they have
        no contig alignments and few read alignments.
        ${
          CoverageVizBottomSidebarConfig[workflow].isReadLevelVizAvailable
            ? " To see them, go to the read-level visualization."
            : ""
        }
      `;

    return (
      <div className={cs.header}>
        <div className={cs.headerText}>
          {this.renderTaxonLabel()}
          <BareDropdown
            options={this.getAccessionOptions()}
            value={get("id", currentAccessionSummary)}
            // @ts-expect-error Property 'label' does not exist on type
            label="Accession"
            trigger={
              <div className={cs.accessionLabel}>
                {get("id", currentAccessionSummary)} -{" "}
                {get("name", currentAccessionSummary)}
              </div>
            }
            onChange={(accessionId: string) => {
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
            <div className={cs.actionIcons}>
              {this.renderBlastAction()}
              <BasicPopup
                className={cs.actionIconPopup}
                basic={false}
                content="Download Contig FASTA"
                position="top center"
                inverted
                trigger={
                  <ButtonIcon
                    className={cs.iconButton}
                    onClick={() =>
                      openUrl(
                        getDownloadContigUrl({
                          pipelineVersion,
                          sampleId,
                          taxId: taxonId,
                        }),
                      )
                    }
                    sdsSize="large"
                    sdsType="secondary"
                    sdsIcon="download"
                  />
                }
              />
            </div>
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
          <LoadingMessage message="Loading Visualization..." />
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
                href={CONTACT_US_LINK}
                target="_blank"
                rel="noopener noreferrer"
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

    const contigHitGroups = selectContigsFromHitGroups(
      currentAccessionData.hit_groups,
    );
    const readHitGroups = selectReadsFromHitGroups(
      currentAccessionData.hit_groups,
    );

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
    const totalContigs = currentAccessionSummary.num_contigs; // total number of contigs not contig fragments
    const totalReads = sum(readHitGroups.map(hitGroup => hitGroup[1]));
    const metrics = this.getAccessionMetrics(totalReads);

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
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            this.coverageVizContainer = coverageVizContainer;
          }}
        />
        <div className={cs.genomeVizRow}>
          <div className={cs.rowLabel}>Reference Accession</div>
          <BasicPopup
            trigger={
              <a
                className={cx(cs.refAccessionVizLink, cs.genomeViz)}
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
                href={`https://www.ncbi.nlm.nih.gov/nuccore/${currentAccessionSummary.id}?report=genbank`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div
                  className={cs.genomeVizInner}
                  ref={refAccessionVizContainer => {
                    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                    this.refAccessionVizContainer = refAccessionVizContainer;
                  }}
                />
              </a>
            }
            inverted
            wide="very"
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
            content={currentAccessionSummary.name}
          />
        </div>
        <HitGroupViz
          accessionData={currentAccessionData}
          color={CONTIG_FILL_COLOR}
          hitGroups={contigHitGroups}
          key="contigHitGroupViz"
          label={`NT Contigs (${totalContigs})`}
          pipelineVersion={pipelineVersion}
          sampleId={sampleId}
          snapshotShareId={snapshotShareId}
          taxonId={params.taxonId}
        />
        {!isEmpty(readHitGroups) && (
          <HitGroupViz
            key="readHitGroupViz"
            label={`Loose NT Reads (${totalReads})`}
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
    const { workflow, wdlVersion } = this.props;

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
                {CoverageVizBottomSidebarConfig[
                  workflow
                ].getUnavailableMessage?.(wdlVersion)}
              </div>
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

CoverageVizBottomSidebar.contextType = UserContext;
