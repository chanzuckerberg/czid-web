import cx from "classnames";
import { camelCase, find, get, getOr, isEmpty, isNil, size } from "lodash/fp";
import memoize from "memoize-one";
import React, { useEffect, useRef, useState } from "react";
import { trackEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { formatPercent } from "~/components/utils/format";
import { getTooltipStyle } from "~/components/utils/tooltip";
import { WORKFLOWS } from "~/components/utils/workflows";
import Histogram, {
  HISTOGRAM_SCALE,
} from "~/components/visualizations/Histogram";
import { Table } from "~/components/visualizations/table";
import { numberWithCommas } from "~/helpers/strings";
import Sample, { WorkflowRun } from "~/interface/sample";
import { WorkflowRunResults } from "~/interface/sampleView";
import { HelpIcon, TooltipVizTable } from "~ui/containers";
import ExternalLink from "~ui/controls/ExternalLink";
import { IconArrowRight } from "~ui/icons";
import {
  SARS_COV_2_CONSENSUS_GENOME_DOC_LINK,
  VIRAL_CONSENSUS_GENOME_DOC_LINK,
} from "~utils/documentationLinks";
import { FIELDS_METADATA } from "~utils/tooltip";
import cs from "./consensus_genome_view.scss";
import ConsensusGenomeDropdown from "./ConsensusGenomeDropdown";
import {
  CG_HISTOGRAM_FILL_COLOR,
  CG_HISTOGRAM_HOVER_FILL_COLOR,
  CG_VIEW_METRIC_COLUMNS,
  RUNNING_STATE,
  SARS_COV_2_ACCESSION_ID,
} from "./constants";
import SampleReportContent from "./SampleReportContent";

interface ConsensusGenomeViewProps {
  link?: string;
  loadingResults?: boolean;
  onWorkflowRunSelect?: $TSFixMeFunction;
  sample: Sample;
  test?: string;
  workflowRun?: WorkflowRun;
  workflowRunResults?: WorkflowRunResults | Record<string, never>;
}

const ConsensusGenomeView = ({
  onWorkflowRunSelect,
  sample,
  loadingResults,
  workflowRun,
  workflowRunResults,
}: ConsensusGenomeViewProps) => {
  const coverageVizContainerRef = useRef();
  const [histogramTooltipData, setHistogramTooltipData] = useState(null);
  const [histogramTooltipLocation, setHistogramTooltipLocation] =
    useState(null);
  const consensusGenomeWorkflowRuns = sample.workflow_runs.filter(
    run => run.workflow === WORKFLOWS.CONSENSUS_GENOME.value,
  );
  useEffect(() => {
    if (
      !isNil(coverageVizContainerRef.current) &&
      workflowRunResults &&
      workflowRunResults.coverage_viz
    )
      renderHistogram();
  }, [coverageVizContainerRef.current, workflowRunResults]);

  const renderConsensusGenomeDropdown = () => {
    return (
      <div className={cs.dropdownContainer}>
        <ConsensusGenomeDropdown
          workflowRuns={consensusGenomeWorkflowRuns}
          initialSelectedValue={workflowRun.id}
          onConsensusGenomeSelection={workflowRunId =>
            onWorkflowRunSelect(
              find({ id: workflowRunId }, consensusGenomeWorkflowRuns),
            )
          }
        />
      </div>
    );
  };

  const renderHeaderInfoAndDropdown = () => {
    const shouldRenderCGDropdown = size(consensusGenomeWorkflowRuns) > 1;
    return (
      <div
        className={cx(
          cs.headerContainer,
          !shouldRenderCGDropdown && cs.removeBottomMargin,
        )}
      >
        {shouldRenderCGDropdown && renderConsensusGenomeDropdown()}
        {get("status", workflowRun) !== RUNNING_STATE && (
          <ExternalLink
            className={cx(
              cs.learnMoreLink,
              !shouldRenderCGDropdown && cs.alignRight,
            )}
            href={computeHelpLink()}
            analyticsEventName={"ConsensusGenomeView_learn-more-link_clicked"}
          >
            Learn more about consensus genomes <IconArrowRight />
          </ExternalLink>
        )}
      </div>
    );
  };

  const renderResults = () => {
    return (
      <>
        <div className={cs.resultsContainer}>
          {workflowRunResults &&
            !isEmpty(workflowRunResults.quality_metrics) &&
            renderMetricsTable()}
          {workflowRunResults &&
            !isEmpty(workflowRunResults.coverage_viz) &&
            renderCoverageView()}
        </div>
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

  const handleHistogramBarEnter = (hoverData: $TSFixMe) => {
    if (hoverData && hoverData[0] === 0) {
      const tooltipData = getHistogramTooltipData(
        workflowRunResults.coverage_viz,
        hoverData[1],
      );

      setHistogramTooltipData(tooltipData);
    }
  };

  const handleHistogramBarHover = (clientX: $TSFixMe, clientY: $TSFixMe) => {
    setHistogramTooltipLocation({
      left: clientX,
      top: clientY,
    });
  };

  const handleHistogramBarExit = () => {
    setHistogramTooltipLocation(null);
    setHistogramTooltipData(null);
  };

  const renderHistogram = () => {
    if (coverageVizContainerRef.current !== null) {
      const coverageVizData = workflowRunResults.coverage_viz.coverage.map(
        valueArr => ({
          x0: valueArr[0] * workflowRunResults.coverage_viz.coverage_bin_size,
          length: valueArr[1], // Actually the height. This is a d3-histogram naming convention.
        }),
      );
      const subtext = `${workflowRunResults.taxon_info.accession_id} - ${workflowRunResults.taxon_info.accession_name}`;

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
  };

  const getAccessionMetrics = () => {
    const {
      accession_id: accessionId,
      taxonId,
      taxon_name: taxonName,
    } = workflowRunResults.taxon_info;
    const {
      coverage_breadth: coverageBreadth,
      coverage_depth: coverageDepth,
      total_length: totalLength,
    } = workflowRunResults.coverage_viz;

    const referenceNCBIEntry = (
      <BasicPopup
        trigger={
          <div className={cs.ncbiLinkWrapper}>
            <ExternalLink
              href={`https://www.ncbi.nlm.nih.gov/nuccore/${accessionId}?report=genbank`}
              analyticsEventName={"ConsensusGenomeView_ncbi-link_clicked"}
              analyticsEventData={{
                accessionId,
                taxonId,
                sampleId: sample.id,
              }}
            >
              {accessionId}
            </ExternalLink>
          </div>
        }
        inverted={false}
        content={taxonName}
      />
    );

    return {
      referenceNCBIEntry,
      referenceLength: totalLength,
      coverageDepth: `${coverageDepth.toFixed(1)}x`,
      coverageBreadth: formatPercent(coverageBreadth),
    };
  };

  const renderCoverageView = () => {
    const helpLink = (
      <ExternalLink
        href={computeHelpLink()}
        analyticsEventName={"ConsensusGenomeView_help-link_clicked"}
      >
        Learn more.
      </ExternalLink>
    );

    const metrics = getAccessionMetrics();
    return (
      <div className={cs.section}>
        <div className={cs.title}>
          How good is the coverage?
          {renderHelpIcon({
            text: "These metrics and chart help determine the coverage of the reference accession.",
            link: helpLink,
            analytics: {
              analyticsEventName:
                "ConsensusGenomeView_quality-metrics-help-icon_hovered",
            },
            iconStyle: cs.lower,
          })}
        </div>
        <div className={cx(cs.coverageContainer, cs.raisedContainer)}>
          <div className={cs.metrics}>
            {CG_VIEW_METRIC_COLUMNS.map((col, index) => (
              <div className={cs.column} key={index}>
                {col.map(metric => (
                  <div className={cs.metric} key={metric.key}>
                    <div className={cs.label}>
                      <BasicPopup
                        trigger={<div>{metric.label}</div>}
                        inverted={false}
                        content={metric.tooltip}
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
            ref={coverageVizContainerRef}
            onMouseEnter={() =>
              trackEvent("ConsensusGenomeView_coverage-viz-histogram_hovered")
            }
          />
        </div>
      </div>
    );
  };

  const renderHelpIcon = ({
    text,
    link = null,
    analytics = null,
    iconStyle = null,
  }: $TSFixMe) => {
    return (
      <HelpIcon
        text={
          <>
            {text} {link}
          </>
        }
        className={cx(cs.helpIcon, !!iconStyle && iconStyle)}
        // @ts-expect-error Working with Lodash types
        analyticsEventName={getOr(undefined, "analyticsEventName", analytics)}
        analyticsEventData={getOr(undefined, "analyticsEventData", analytics)}
      />
    );
  };

  const renderMetricsTable = () => {
    const metricsData = {
      taxon_name: workflowRunResults.taxon_info.taxon_name,
      ...workflowRunResults.quality_metrics,
    };
    const helpLink = (
      <ExternalLink
        href={computeHelpLink()}
        analyticsEventName={
          "ConsensusGenomeView_quality-metrics-help-link_clicked"
        }
      >
        Learn more.
      </ExternalLink>
    );
    return (
      <div className={cs.section}>
        <div className={cs.title}>
          Is my consensus genome complete?
          {renderHelpIcon({
            text: "These metrics help determine the quality of the reference accession.",
            link: helpLink,
            analytics: {
              analyticsEventName:
                "ConsensusGenomeView_quality-metrics-help-icon_hovered",
            },
            iconStyle: cs.lower,
          })}
        </div>
        <div className={cx(cs.metricsTable, cs.raisedContainer)}>
          <Table
            columns={computeQualityMetricColumns()}
            data={[metricsData]}
            defaultRowHeight={55}
            gridClassName={cs.tableGrid}
            headerClassName={cs.tableHeader}
            headerRowClassName={cs.tableHeaderRow}
            headerHeight={25}
            headerLabelClassName={cs.tableHeaderLabel}
            rowClassName={cs.tableRow}
          />
        </div>
      </div>
    );
  };

  const computeQualityMetricColumns = () => {
    const renderRowCell = (
      { cellData }: $TSFixMe,
      options: { percent?: $TSFixMeUnknown } = {},
    ) => (
      <div className={cs.cell}>
        {cellData}
        {options && options.percent ? "%" : null}
      </div>
    );
    const columns = [
      {
        className: cs.taxonName,
        dataKey: "taxon_name",
        headerClassName: cs.primaryHeader,
        label: "Taxon",
        width: 320,
      },
      {
        dataKey: "mapped_reads",
        width: 80,
      },
      {
        cellRenderer: (cellData: $TSFixMe) =>
          renderRowCell(cellData, { percent: true }),
        dataKey: "gc_percent",
        width: 60,
      },
      {
        dataKey: "ref_snps",
        width: 20,
      },
      {
        cellRenderer: (cellData: $TSFixMe) =>
          renderRowCell(cellData, { percent: true }),
        dataKey: "percent_identity",
        width: 30,
      },
      {
        dataKey: "n_actg",
        width: 135,
      },
      {
        cellRenderer: (cellData: $TSFixMe) =>
          renderRowCell(cellData, { percent: true }),
        dataKey: "percent_genome_called",
        width: 100,
      },
      {
        dataKey: "n_missing",
        width: 75,
      },
      {
        dataKey: "n_ambiguous",
        width: 100,
      },
    ];

    for (const col of columns) {
      if (!col["cellRenderer"]) {
        col["cellRenderer"] = renderRowCell;
      }
      col["flexGrow"] = 1;

      // TODO: Convert to send in camelCase from the backend.
      const key = camelCase(col["dataKey"]);
      if (key in FIELDS_METADATA) {
        col["columnData"] = FIELDS_METADATA[key];
        col["label"] = FIELDS_METADATA[key].label;
      }
    }
    return columns;
  };

  const computeHelpLink = () => {
    if (get("inputs.accession_id", workflowRun) === SARS_COV_2_ACCESSION_ID) {
      return SARS_COV_2_CONSENSUS_GENOME_DOC_LINK;
    }
    return VIRAL_CONSENSUS_GENOME_DOC_LINK;
  };

  return (
    <>
      {renderHeaderInfoAndDropdown()}
      <SampleReportContent
        sample={sample}
        workflowRun={workflowRun}
        loadingResults={loadingResults}
        loadingInfo={{
          linkText: "Learn about Consensus Genomes",
          message: "Your Consensus Genome is being generated!",
          helpLink: computeHelpLink(),
        }}
        eventNames={{
          error: "ConsensusGenomeView_sample-error-info-link_clicked",
          loading: "ConsensusGenomeView_consenus-genome-doc-link_clicked",
        }}
        renderResults={renderResults}
      />
    </>
  );
};

export default ConsensusGenomeView;
