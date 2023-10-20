import { Icon } from "@czi-sds/components";
import cx from "classnames";
import copy from "copy-to-clipboard";
import { get, map, size, sum } from "lodash/fp";
import React from "react";
import ReactDOM from "react-dom";
import { getContigsSequencesByByteranges } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  useWithAnalytics,
  WithAnalyticsType,
} from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { getTooltipStyle } from "~/components/utils/tooltip";
import GenomeViz from "~/components/visualizations/GenomeViz";
import { getURLParamString } from "~/helpers/url";
import { GenomeVizShape, TooltipLocation } from "~/interface/shared";
import { TooltipVizTable } from "~ui/containers";
import cs from "./coverage_viz_bottom_sidebar.scss";
import { AccessionsData } from "./types";
import { generateContigReadVizData, getGenomeVizTooltipData } from "./utils";

const DEFAULT_CONTIG_COPY_MESSAGE = "Copy Contig Sequence to Clipboard";

const totalByterangeLength = (byteranges: [number, number][]) =>
  sum(map(range => range[1], byteranges));

interface HitGroupVizProps {
  label: string;
  hitGroups: AccessionsData["hit_groups"];
  accessionData: AccessionsData;
  sampleId: number;
  taxonId: number;
  pipelineVersion: string;
  color: string;
  snapshotShareId?: string;
}

interface HitGroupVizWithAnalyticsProps extends HitGroupVizProps {
  withAnalytics: WithAnalyticsType;
}

interface HitGroupVizState {
  genomeVizTooltipLocation?: TooltipLocation;
  genomeVizTooltipData: {
    name: string;
    data: [string, string | number][];
  }[];
  contigDownloaderLocation?: TooltipLocation;
  contigDownloaderData: { contigByteranges: [number, number][] };
  currentCopyIconMessage: string;
}

class HitGroupVizCC extends React.Component<
  HitGroupVizWithAnalyticsProps,
  HitGroupVizState
> {
  private hitGroupVizContainer: $TSFixMe;
  private _contigDownloader: $TSFixMe | null;
  private hitGroupViz: GenomeVizShape;

  state: HitGroupVizState = {
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

  componentDidUpdate(prevProps: { accessionData: any }) {
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

  handleGenomeVizBarEnter = (hoverData: number) => {
    const { hitGroups } = this.props;

    if (hoverData !== null) {
      this.setState({
        genomeVizTooltipData: getGenomeVizTooltipData(hitGroups, hoverData),
      });
    }
  };

  handleGenomeVizBarHover = (clientX: any, clientY: any) => {
    this.setState({
      genomeVizTooltipLocation: {
        left: clientX,
        top: clientY,
      },
    });
  };

  handleGenomeVizBarClick = (
    dataIndex: string | number | null,
    barRight?: number,
    barTop?: number,
  ) => {
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

  renderGenomeViz = (
    accessionData: AccessionsData,
    hitGroups: AccessionsData["hit_groups"],
  ) => {
    const hitGroupVizData = generateContigReadVizData(
      hitGroups,
      accessionData.coverage_bin_size,
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
      },
    );
    this.hitGroupViz.update();
  };

  handleContigDownload = () => {
    const { contigDownloaderData } = this.state;

    if (contigDownloaderData.contigByteranges) {
      const params = getURLParamString({
        byteranges: contigDownloaderData.contigByteranges.map(byterange =>
          byterange.join(","),
        ),
        pipelineVersion: this.props.pipelineVersion,
      });
      location.href = `/samples/${this.props.sampleId}/contigs_fasta_by_byteranges?${params}`;
    }
  };

  handleContigCopy = async () => {
    const { contigDownloaderData } = this.state;

    const data = await getContigsSequencesByByteranges(
      this.props.sampleId,
      contigDownloaderData.contigByteranges,
      this.props.pipelineVersion,
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
        <TooltipVizTable data={genomeVizTooltipData} />
      </div>,
      document.body,
    );
  };

  renderContigDownloader = () => {
    const { sampleId, taxonId, accessionData, withAnalytics } = this.props;
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
                ANALYTICS_EVENT_NAMES.HIT_GROUP_VIZ_CONTIG_DOWNLOAD_BUTTON_CLICKED,
                {
                  numBytes: totalByterangeLength(
                    get("contigByteranges", contigDownloaderData),
                  ),
                  numContigs: size(
                    get("contigByteranges", contigDownloaderData),
                  ),
                  accessionId: accessionData.id,
                  taxonId,
                  sampleId,
                },
              )}
            >
              <Icon sdsIcon="download" sdsSize="s" sdsType="button" />
            </div>
          }
          inverted
          wide="very"
          content="Download Contig FASTA"
        />
        <BasicPopup
          trigger={
            <div
              className={cx(cs.icon)}
              onClick={withAnalytics(
                this.handleContigCopy,
                ANALYTICS_EVENT_NAMES.HIT_GROUP_VIZ_CONTIG_COPY_BUTTON_CLICKED,
                {
                  numBytes: totalByterangeLength(
                    get("contigByteranges", contigDownloaderData),
                  ),
                  numContigs: size(
                    get("contigByteranges", contigDownloaderData),
                  ),
                  accessionId: accessionData.id,
                  taxonId,
                  sampleId,
                },
              )}
              onMouseEnter={this.restoreCopyIconMessage}
            >
              <Icon sdsIcon="copy" sdsSize="s" sdsType="button" />
            </div>
          }
          inverted
          wide="very"
          content={this.state.currentCopyIconMessage}
        />
      </div>,
      document.body,
    );
  };

  render() {
    const { label, snapshotShareId } = this.props;
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
        {contigDownloaderLocation &&
          contigDownloaderData &&
          !snapshotShareId &&
          this.renderContigDownloader()}
      </div>
    );
  }
}

// Using a function component wrapper provides a semi-hacky way to
// access useContext without the class component to function component
// conversion.
const HitGroupViz = (props: HitGroupVizProps) => {
  const withAnalytics = useWithAnalytics();

  return <HitGroupVizCC {...props} withAnalytics={withAnalytics} />;
};

export default HitGroupViz;
