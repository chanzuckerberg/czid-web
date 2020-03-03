import React from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import cx from "classnames";
import copy from "copy-to-clipboard";
import { get, map, sum, size } from "lodash/fp";

import { withAnalytics } from "~/api/analytics";
import { DataTooltip } from "~ui/containers";
import BasicPopup from "~/components/BasicPopup";
import GenomeViz from "~/components/visualizations/GenomeViz";
import DownloadIcon from "~ui/icons/DownloadIcon";
import CopyIcon from "~ui/icons/CopyIcon";
import { getURLParamString } from "~/helpers/url";
import { getContigsSequencesByByteranges } from "~/api";
import { getTooltipStyle } from "~/components/utils/tooltip";

import cs from "./coverage_viz_bottom_sidebar.scss";
import { generateContigReadVizData, getGenomeVizTooltipData } from "./utils";

const NCOV_PUBLIC_SITE = true;

const DEFAULT_CONTIG_COPY_MESSAGE = "Copy Contig Sequence to Clipboard";

const totalByterangeLength = byteranges =>
  sum(map(range => range[1], byteranges));

export default class HitGroupViz extends React.Component {
  state = {
    genomeVizTooltipLocation: null,
    genomeVizTooltipData: null,
    contigDownloaderLocation: null,
    contigDownloaderData: null,
    currentCopyIconMessage: DEFAULT_CONTIG_COPY_MESSAGE,
  };

  componentDidMount() {
    const { accessionData, hitGroups } = this.props;
    if (accessionData && hitGroups) {
      this.renderGenomeViz(accessionData, hitGroups);
    }
    document.addEventListener("mousedown", this.handleOutClick);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleOutClick);
  }

  componentDidUpdate(prevProps) {
    const { accessionData, hitGroups } = this.props;
    if (!prevProps.accessionData && accessionData && hitGroups) {
      this.renderGenomeViz(accessionData, hitGroups);
    }
  }

  handleOutClick = () => {
    if (
      !(
        this.hitGroupVizContainer &&
        this.hitGroupVizContainer.contains(event.target)
      ) &&
      !(this._contigDownloader && this._contigDownloader.contains(event.target))
    ) {
      this.handleGenomeVizBarClick(null);
      // Manually clear the bar outline from hitGroupViz in this special case,
      // since the hitGroupViz would otherwise know the contigDownloader had been cleared.
      this.hitGroupViz.outlineBar(null, false);
    }
  };

  handleGenomeVizBarEnter = hoverData => {
    const { hitGroups } = this.props;

    if (hoverData !== null) {
      this.setState({
        genomeVizTooltipData: getGenomeVizTooltipData(hitGroups, hoverData),
      });
    }
  };

  handleGenomeVizBarHover = (clientX, clientY) => {
    this.setState({
      genomeVizTooltipLocation: {
        left: clientX,
        top: clientY,
      },
    });
  };

  handleGenomeVizBarClick = (dataIndex, barRight, barTop) => {
    const { hitGroups } = this.props;
    if (dataIndex === null) {
      this.setState({
        contigDownloaderData: null,
        contigDownloaderLocation: null,
      });
    } else {
      // Only open the contig downloader if there are contigs in this hitGroup.
      const hitGroup = hitGroups[dataIndex];
      if (hitGroup[0] > 0 && hitGroup[10].length > 0) {
        this.setState({
          contigDownloaderData: {
            contigByteranges: hitGroup[10],
          },
          contigDownloaderLocation: {
            // We apply a translate 100% in CSS to move the tooltip to the correct location.
            left: barRight,
            top: barTop,
          },
        });
      } else {
        this.setState({
          contigDownloaderData: null,
          contigDownloaderLocation: null,
        });
      }
    }
  };

  handleGenomeVizBarExit = () => {
    this.setState({
      genomeVizTooltipLocation: null,
      genomeVizTooltipData: null,
    });
  };

  renderGenomeViz = (accessionData, hitGroups) => {
    const hitGroupVizData = generateContigReadVizData(
      hitGroups,
      accessionData.coverage_bin_size
    );

    this.hitGroupViz = new GenomeViz(
      this.hitGroupVizContainer,
      hitGroupVizData,
      {
        domain: [0, accessionData.total_length],
        color: this.props.color,
        onGenomeVizBarHover: this.handleGenomeVizBarHover,
        onGenomeVizBarEnter: this.handleGenomeVizBarEnter,
        onGenomeVizBarExit: this.handleGenomeVizBarExit,
        onGenomeVizBarClick: this.handleGenomeVizBarClick,
        hoverDarkenFactor: 0.4,
      }
    );
    this.hitGroupViz.update();
  };

  handleContigDownload = () => {
    const { contigDownloaderData } = this.state;

    if (contigDownloaderData.contigByteranges) {
      const params = getURLParamString({
        byteranges: contigDownloaderData.contigByteranges.map(byterange =>
          byterange.join(",")
        ),
        pipelineVersion: this.props.pipelineVersion,
      });
      location.href = `/samples/${
        this.props.sampleId
      }/contigs_fasta_by_byteranges?${params}`;
    }
  };

  handleContigCopy = async () => {
    const { contigDownloaderData } = this.state;

    const data = await getContigsSequencesByByteranges(
      this.props.sampleId,
      contigDownloaderData.contigByteranges,
      this.props.pipelineVersion
    );

    copy(Object.values(data).join("\n"));

    this.setState({
      currentCopyIconMessage: "Copied to clipboard!",
    });
  };

  restoreCopyIconMessage = () => {
    this.setState({
      currentCopyIconMessage: DEFAULT_CONTIG_COPY_MESSAGE,
    });
  };

  renderGenomeVizTooltip = () => {
    const { genomeVizTooltipLocation, genomeVizTooltipData } = this.state;

    return ReactDOM.createPortal(
      <div
        style={getTooltipStyle(genomeVizTooltipLocation)}
        className={cs.hoverTooltip}
      >
        <DataTooltip data={genomeVizTooltipData} />
      </div>,
      document.body
    );
  };

  renderContigDownloader = () => {
    const { sampleId, taxonId, accessionData } = this.props;
    const { contigDownloaderLocation, contigDownloaderData } = this.state;

    return ReactDOM.createPortal(
      <div
        style={{
          left: contigDownloaderLocation.left,
          top: contigDownloaderLocation.top - 5,
        }}
        className={cs.contigDownloader}
        ref={c => (this._contigDownloader = c)}
      >
        <BasicPopup
          trigger={
            <div
              className={cx(cs.icon, cs.downloadIcon)}
              onClick={withAnalytics(
                this.handleContigDownload,
                "HitGroupViz_contig-download-button_clicked",
                {
                  numBytes: totalByterangeLength(
                    get("contigByteranges", contigDownloaderData)
                  ),
                  numContigs: size(
                    get("contigByteranges", contigDownloaderData)
                  ),
                  accessionId: accessionData.id,
                  taxonId,
                  sampleId,
                }
              )}
            >
              <DownloadIcon />
            </div>
          }
          inverted
          wide="very"
          content="Download Contig FASTA"
        />
        <BasicPopup
          trigger={
            <div
              className={cx(cs.icon, cs.copyIcon)}
              onClick={withAnalytics(
                this.handleContigCopy,
                "HitGroupViz_contig-copy-button_clicked",
                {
                  numBytes: totalByterangeLength(
                    get("contigByteranges", contigDownloaderData)
                  ),
                  numContigs: size(
                    get("contigByteranges", contigDownloaderData)
                  ),
                  accessionId: accessionData.id,
                  taxonId,
                  sampleId,
                }
              )}
              onMouseEnter={this.restoreCopyIconMessage}
            >
              <CopyIcon />
            </div>
          }
          inverted
          wide="very"
          content={this.state.currentCopyIconMessage}
        />
      </div>,
      document.body
    );
  };

  render() {
    const { label } = this.props;

    const {
      genomeVizTooltipLocation,
      genomeVizTooltipData,
      contigDownloaderLocation,
      contigDownloaderData,
    } = this.state;

    return (
      <div className={cs.genomeVizRow}>
        <div className={cs.rowLabel}>{label}</div>
        <div
          className={cs.genomeViz}
          ref={hitGroupVizContainer => {
            this.hitGroupVizContainer = hitGroupVizContainer;
          }}
        />
        {genomeVizTooltipLocation &&
          genomeVizTooltipData &&
          this.renderGenomeVizTooltip()}
        {!NCOV_PUBLIC_SITE &&
          contigDownloaderLocation &&
          contigDownloaderData &&
          this.renderContigDownloader()}
      </div>
    );
  }
}

HitGroupViz.propTypes = {
  label: PropTypes.string,
  hitGroups: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.number),
      ])
    )
  ),
  accessionData: PropTypes.shape({
    avg_prop_mismatch: PropTypes.number,
    coverage: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    coverage_bin_size: PropTypes.number,
    coverage_breadth: PropTypes.number,
    coverage_depth: PropTypes.number,
    id: PropTypes.number,
    max_aligned_length: PropTypes.number,
    name: PropTypes.string,
    total_length: PropTypes.number,
  }),
  sampleId: PropTypes.number,
  taxonId: PropTypes.number,
  pipelineVersion: PropTypes.string,
  color: PropTypes.string,
};
