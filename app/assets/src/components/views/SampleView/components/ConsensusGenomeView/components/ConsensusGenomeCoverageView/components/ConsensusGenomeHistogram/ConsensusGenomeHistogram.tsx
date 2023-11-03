import { isNil } from "lodash/fp";
import memoize from "memoize-one";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { ConsensusGenomeWorkflowRunResults } from "~/interface/sampleView";

interface ConsensusGenomeHistogramProps {
  workflowRun: WorkflowRun;
  workflowRunResults: ConsensusGenomeWorkflowRunResults;
}

export const ConsensusGenomeHistogram = ({
  workflowRun,
  workflowRunResults,
}: ConsensusGenomeHistogramProps) => {
  const coverageVizContainerRef = useRef();

  const [histogramTooltipData, setHistogramTooltipData] = useState(null);
  const [histogramTooltipLocation, setHistogramTooltipLocation] =
    useState(null);

  const getHistogramTooltipData = memoize((accessionData, coverageIndex) => {
    // coverageObj format:
    //   [binIndex, averageCoverageDepth, coverageBreadth, numberContigs, numberReads]
    const coverageObj = accessionData.coverage[coverageIndex];
    const binSize = accessionData.coverage_bin_size;

    return [
      {
        name: "Coverage",
        data: [
          [
            "Base Pair Range",
            // \u2013 is en-dash
            `${Math.round(coverageObj[0] * binSize)}\u2013${Math.round(
              (coverageObj[0] + 1) * binSize,
            )}`,
          ],
          ["Coverage Depth", `${coverageObj[1]}x`],
          ["Coverage Breadth", formatPercent(coverageObj[2])],
        ],
      },
    ];
  });

  const handleHistogramBarEnter = useCallback(
    (hoverData: $TSFixMe) => {
      if (hoverData && hoverData[0] === 0) {
        const tooltipData = getHistogramTooltipData(
          workflowRunResults.coverage_viz,
          hoverData[1],
        );

        // @ts-expect-error CZID-8698 enable strictNullChecks: error TS2345
        setHistogramTooltipData(tooltipData);
      }
    },
    [getHistogramTooltipData, workflowRunResults?.coverage_viz],
  );

  const handleHistogramBarHover = (clientX: $TSFixMe, clientY: $TSFixMe) => {
    setHistogramTooltipLocation({
      // @ts-expect-error CZID-8698 enable strictNullChecks: error TS2345
      left: clientX,
      top: clientY,
    });
  };

  const handleHistogramBarExit = () => {
    setHistogramTooltipLocation(null);
    setHistogramTooltipData(null);
  };

  const renderHistogram = useCallback(() => {
    if (coverageVizContainerRef.current !== null) {
      const coverageVizData = workflowRunResults.coverage_viz.coverage.map(
        valueArr => ({
          // @ts-expect-error CZID-8698 enable strictNullChecks: error TS18046
          x0: valueArr[0] * workflowRunResults.coverage_viz.coverage_bin_size,
          // @ts-expect-error CZID-8698 enable strictNullChecks: error TS18046
          length: valueArr[1], // Actually the height. This is a d3-histogram naming convention.
        }),
      );

      const accessionID =
        workflowRunResults.taxon_info.accession_id ?? "Unknown accession";

      // accessionName for WGS could not exist, if so fall back to taxonName
      const taxonName =
        workflowRunResults.taxon_info.accession_name ??
        workflowRunResults.taxon_info.taxon_name ??
        "Unknown taxon";

      const { creation_source: creationSource, ref_fasta: refFasta } =
        workflowRun.inputs ?? {};
      const isWGS = creationSource === CreationSource.WGS;
      const subtext = isWGS ? refFasta : `${accessionID} - ${taxonName}`;

      new Histogram(coverageVizContainerRef.current, [coverageVizData], {
        barOpacity: 1,
        colors: [CG_HISTOGRAM_FILL_COLOR],
        domain: [0, workflowRunResults.coverage_viz.total_length],
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
        numBins: Math.round(
          workflowRunResults.coverage_viz.total_length /
            workflowRunResults.coverage_viz.coverage_bin_size,
        ),
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
    workflowRunResults?.coverage_viz?.coverage,
    workflowRunResults?.coverage_viz?.coverage_bin_size,
    workflowRunResults?.coverage_viz?.total_length,
    workflowRunResults?.taxon_info?.accession_id,
    workflowRunResults?.taxon_info?.accession_name,
    workflowRunResults?.taxon_info?.taxon_name,
  ]);

  useEffect(() => {
    if (
      !isNil(coverageVizContainerRef.current) &&
      workflowRunResults?.coverage_viz
    )
      renderHistogram();
  }, [renderHistogram, workflowRunResults?.coverage_viz]);

  return (
    <>
      {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322 */}
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
