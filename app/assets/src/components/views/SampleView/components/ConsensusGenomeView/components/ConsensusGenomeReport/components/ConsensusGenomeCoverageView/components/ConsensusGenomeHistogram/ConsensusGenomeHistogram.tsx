import { isNil } from "lodash/fp";
import memoize from "memoize-one";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { graphql, useFragment } from "react-relay";
import { TooltipData } from "~/components/common/CoverageVizBottomSidebar";
import { TooltipVizTable } from "~/components/ui/containers";
import { formatPercent } from "~/components/utils/format";
import { getTooltipStyle } from "~/components/utils/tooltip";
import cs from "~/components/views/SampleView/components/ConsensusGenomeView/consensus_genome_view.scss";
import {
  CG_HISTOGRAM_FILL_COLOR,
  CG_HISTOGRAM_HOVER_FILL_COLOR,
} from "~/components/views/SampleView/utils";
import Histogram, {
  HISTOGRAM_SCALE,
} from "~/components/visualizations/Histogram";
import { numberWithCommas } from "~/helpers/strings";
import { CreationSource, WorkflowRun } from "~/interface/sample";
import { ConsensusGenomeHistogramFragment$key } from "./__generated__/ConsensusGenomeHistogramFragment.graphql";

export const ConsensusGenomeHistogramFragment = graphql`
  fragment ConsensusGenomeHistogramFragment on ConsensusGenomeWorkflowResults {
    reference_genome {
      accession_id
      accession_name
      taxon {
        name
      }
    }
    metric_consensus_genome {
      coverage_viz {
        coverage @required(action: LOG)
        coverage_bin_size @required(action: LOG)
        total_length @required(action: LOG)
      }
    }
  }
`;
interface ConsensusGenomeHistogramProps {
  workflowRun: WorkflowRun;
  workflowRunResultsData: ConsensusGenomeHistogramFragment$key;
}

export const ConsensusGenomeHistogram = ({
  workflowRun,
  workflowRunResultsData,
}: ConsensusGenomeHistogramProps) => {
  const data = useFragment<ConsensusGenomeHistogramFragment$key>(
    ConsensusGenomeHistogramFragment,
    workflowRunResultsData,
  );
  const {
    reference_genome: referenceGenome,
    metric_consensus_genome: metricConsensusGenome,
  } = data || {};
  const {
    accession_id: accessionId,
    accession_name: accessionName,
    taxon,
  } = referenceGenome || {};
  const taxonName = taxon?.name;
  const coverageViz = metricConsensusGenome?.coverage_viz;

  const coverageVizContainerRef = useRef(null);

  const [histogramTooltipData, setHistogramTooltipData] = useState<
    TooltipData[] | null
  >(null);
  const [histogramTooltipLocation, setHistogramTooltipLocation] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const getHistogramTooltipData: (
    coverage: (readonly (number | null | undefined)[] | null | undefined)[],
    binSize: number,
    coverageIndex: number,
  ) => TooltipData[] = memoize((coverage, binSize, coverageIndex) => {
    // coverageObj format:
    //   [binIndex, averageCoverageDepth, coverageBreadth, numberContigs, numberReads]
    const coverageObj = coverage[coverageIndex];
    return [
      {
        name: "Coverage",
        data: [
          [
            "Base Pair Range",
            // \u2013 is en-dash
            coverageObj && coverageObj[0]
              ? `${Math.round(coverageObj[0] * binSize)}\u2013${Math.round(
                  (coverageObj[0] + 1) * binSize,
                )}`
              : `N/A`,
          ],
          ["Coverage Depth", coverageObj ? `${coverageObj[1]}x` : `N/A`],
          [
            "Coverage Breadth",
            coverageObj ? formatPercent(coverageObj[2] || 0) : `N/A`,
          ],
        ],
      },
    ];
  });

  const handleHistogramBarEnter = useCallback(
    (hoverData: [number, number]) => {
      if (
        hoverData &&
        hoverData[0] === 0 &&
        coverageViz &&
        coverageViz.coverage
      ) {
        const tooltipData = getHistogramTooltipData(
          [...coverageViz.coverage],
          coverageViz.coverage_bin_size,
          hoverData[1],
        );

        setHistogramTooltipData(tooltipData);
      }
    },
    [getHistogramTooltipData, coverageViz],
  );

  const handleHistogramBarHover = (clientX: number, clientY: number) => {
    setHistogramTooltipLocation({
      left: clientX,
      top: clientY,
    });
  };

  const handleHistogramBarExit = () => {
    setHistogramTooltipLocation(null);
    setHistogramTooltipData(null);
  };

  const renderHistogram = useCallback(() => {
    if (!isNil(coverageVizContainerRef.current) && coverageViz) {
      const coverageBinSize = coverageViz.coverage_bin_size;
      const coverage = coverageViz.coverage;
      const totalLength = coverageViz.total_length;

      const coverageVizData = coverage.map(valueArr => {
        return (
          valueArr && {
            x0: valueArr[0] && valueArr[0] * coverageBinSize,
            length: valueArr[1], // Actually the height. This is a d3-histogram naming convention.
          }
        );
      });

      const accessionID = accessionId ?? "Unknown accession";

      // accessionName for WGS could not exist, if so fall back to taxonName
      const displayName = accessionName ?? taxonName ?? "Unknown taxon";

      const { creation_source: creationSource, ref_fasta: refFasta } =
        workflowRun.inputs ?? {};
      const isWGS = creationSource === CreationSource.WGS;
      const subtext = isWGS ? refFasta : `${accessionID} - ${displayName}`;

      new Histogram(coverageVizContainerRef.current, [coverageVizData], {
        barOpacity: 1,
        colors: [CG_HISTOGRAM_FILL_COLOR],
        domain: [0, totalLength],
        hoverColors: [CG_HISTOGRAM_HOVER_FILL_COLOR],
        labelsBold: true,
        labelsLarge: true,
        labelX: "Reference Sequence",
        labelY: "Coverage (SymLog)",
        labelXSubtext: subtext,
        labelYHorizontalOffset: 30,
        labelYVerticalOffset: 54,
        labelYLarge: true,
        margins: {
          left: 100,
          right: 50,
          top: 22,
          bottom: 75,
        },
        numBins: Math.round(totalLength / coverageBinSize),
        numTicksY: 2,
        showStatistics: false,
        skipBins: true,
        yScaleType: HISTOGRAM_SCALE.SYM_LOG,
        yTickFormat: numberWithCommas,
        skipNiceDomains: true,
        onHistogramBarHover: handleHistogramBarHover,
        onHistogramBarEnter: handleHistogramBarEnter,
        onHistogramBarExit: handleHistogramBarExit,
      }).update();
    }
  }, [
    handleHistogramBarEnter,
    workflowRun.inputs,
    coverageViz,
    accessionId,
    accessionName,
    taxonName,
  ]);

  useEffect(() => {
    renderHistogram();
  }, [renderHistogram]);

  return (
    <>
      <div className={cs.coverageVizHistogram} ref={coverageVizContainerRef} />
      {histogramTooltipLocation && histogramTooltipData && (
        <div
          style={getTooltipStyle(histogramTooltipLocation)}
          className={cs.hoverTooltip}
        >
          <TooltipVizTable data={histogramTooltipData} />
        </div>
      )}
    </>
  );
};
