import { Icon } from "@czi-sds/components";
import { cloneDeep } from "lodash";
import { nanoid } from "nanoid";
import React, { useEffect, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import { SampleDetailsModeProps } from "~/components/common/DetailsSidebar/SampleDetailsMode";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import ImgVizSecondary from "~/components/ui/illustrations/ImgVizSecondary";
import { SHARED_SAMPLE_TABLE_COLUMNS } from "~/components/views/samples/constants";
import BarChartToggle from "~/components/visualizations/bar_charts/BarChartToggle";
import HorizontalStackedBarChart from "~/components/visualizations/bar_charts/HorizontalStackedBarChart";
import CategoricalLegend from "~/components/visualizations/legends/CategoricalLegend";
import { numberWithPercent } from "~/helpers/strings";
import Sample from "~/interface/sample";
import {
  HUMAN_READABLE_STEP_NAMES,
  READS_LOST_STACK_COLORS,
  READS_REMAINING,
  READS_REMAINING_COLOR,
} from "../../../constants";
import InfoBanner from "../../../InfoBanner";
import { ReadsLostChartQuery as ReadsLostChartQueryType } from "./__generated__/ReadsLostChartQuery.graphql";
import cs from "./reads_lost_chart.scss";

interface ReadsLostChartProps {
  validSamples: Sample[];
  handleChartElementHover: (clientX: number, clientY: number) => void;
  handleChartElementExit: () => void;
  setChartTooltipData: $TSFixMeFunction;
  setTooltipClass: (tooltipClass: string) => void;
  setSidebarVisible: (sidebarVisible: boolean) => void;
  setSidebarParams: (sidebarParams: SampleDetailsModeProps) => void;
  sidebarParams: SampleDetailsModeProps;
  sidebarVisible: boolean;
}

export const ReadsLostChartQuery = graphql`
  query ReadsLostChartQuery($sampleIds: [Int!]!) {
    sampleReadsStats(sampleIds: $sampleIds) {
      sampleReadsStats {
        sampleId
        initialReads
        name
        pipelineVersion
        sampleId
        wdlVersion
        steps {
          name
          readsAfter
        }
      }
    }
  }
`;

export const ReadsLostChart = ({
  validSamples,
  handleChartElementHover,
  handleChartElementExit,
  setChartTooltipData,
  setTooltipClass,
  setSidebarVisible,
  setSidebarParams,
  sidebarParams,
  sidebarVisible,
}: ReadsLostChartProps) => {
  const trackEvent = useTrackEvent();
  const [normalize, setNormalize] = useState(false);
  const [readsLostData, setReadsLostData] = useState(null);
  const [readsLostLegendColors, setReadsLostLegendColors] = useState(null);
  const [readsLostCategories, setReadsLostCategories] = useState(null);
  const [readsLostChartColors, setReadsLostChartColors] = useState(null);

  const data = useLazyLoadQuery<ReadsLostChartQueryType>(ReadsLostChartQuery, {
    sampleIds: validSamples.map(sample => sample.id),
  });

  const samplesReadsStatsData = data.sampleReadsStats.sampleReadsStats;

  useEffect(() => {
    const { categories, legendColors, _readsLostData } = stackReadsLostData(
      samplesReadsStatsData,
    );
    const chartColors = legendColors.map(({ color }) => color);
    setReadsLostData(_readsLostData);
    setReadsLostLegendColors(legendColors);
    setReadsLostCategories(categories);
    setReadsLostChartColors(chartColors);
  }, []);

  function stackReadsLostData(samplesReadsStats) {
    samplesReadsStats = samplesReadsStats.reduce((result, item) => {
      result[item.sampleId] = cloneDeep(item);
      return result;
    }, {});
    const sampleIds = Object.keys(samplesReadsStats);
    const samplesWithInitialReads = sampleIds.filter(sampleId =>
      Number.isInteger(samplesReadsStats[sampleId].initialReads),
    );

    // Filter out Idseq Dedup step from samples run on pipeline versions >= 4.0
    samplesWithInitialReads.forEach(sampleId => {
      const sampleData = samplesReadsStats[sampleId];

      if (parseFloat(sampleData.pipelineVersion) >= 4) {
        sampleData.steps = sampleData.steps.filter(step => {
          // Cdhitdup required for backwards compatibility
          return (
            step.name !== "Idseq Dedup" &&
            step.name !== "Cdhitdup" &&
            step.name !== "Czid Dedup"
          );
        });
      }
    });

    // Collect all step names and humanize them
    const categories = samplesWithInitialReads.reduce((accum, sampleId) => {
      samplesReadsStats[sampleId].steps.forEach((step, index) => {
        step.name = HUMAN_READABLE_STEP_NAMES[step.name] || step.name;
        if (!accum.includes(step.name)) {
          accum.splice(index, 0, step.name);
        }
      });
      return accum;
    }, []);

    if (categories.length > 0) {
      categories.push(READS_REMAINING);
    }

    const legendColors = categories.map((category, index) => {
      const colorIndex = index % READS_LOST_STACK_COLORS.length;
      return {
        color:
          category === READS_REMAINING
            ? READS_REMAINING_COLOR
            : READS_LOST_STACK_COLORS[colorIndex],
        label: category,
      };
    });

    const _readsLostData = samplesWithInitialReads.map(sampleId => {
      const dataRow: { total?; name? } = {};

      let readsRemaining = samplesReadsStats[sampleId].initialReads;
      samplesReadsStats[sampleId].steps.forEach(step => {
        const readsAfter = step.readsAfter || readsRemaining;
        const readsLost = readsRemaining - readsAfter;
        dataRow[step.name] = readsLost;
        readsRemaining = readsAfter;
      });
      // account for every category
      categories.forEach(category => {
        if (!dataRow[category]) {
          dataRow[category] = 0;
        }
      });
      dataRow.total = samplesReadsStats[sampleId].initialReads;
      dataRow.name = samplesReadsStats[sampleId].name;
      dataRow[READS_REMAINING] = readsRemaining;
      return dataRow;
    });

    return { categories, legendColors, _readsLostData };
  }

  const options = {
    colors: readsLostChartColors,
    x: {
      pathVisible: false,
      ticksVisible: false,
      axisTitle: "reads",
    },
    y: {
      pathVisible: false,
      ticksVisible: false,
    },
  };

  const handleSingleBarStackEnter = (stepName, readsLost) => {
    const stepLegend = readsLostLegendColors.find(
      legendData => legendData.label === stepName,
    );

    const readsLostStr = readsLost.toLocaleString();

    const chartTooltipData = [
      {
        name: "Info",
        data: [
          [
            <CategoricalLegend
              className={cs.inlineLegend}
              data={[stepLegend]}
              key={nanoid()}
            />,
            normalize ? numberWithPercent(readsLostStr) : readsLostStr,
          ],
        ],
        disabled: false,
      },
    ];

    setChartTooltipData(chartTooltipData);
  };

  const handleEmptyBarSpaceEnter = readsLostData => {
    const readsRemainingLegend = readsLostLegendColors.find(
      legendData => legendData.label === READS_REMAINING,
    );
    const readsLostSummary = [];
    readsLostCategories.forEach(category => {
      if (category === READS_REMAINING) {
        return;
      }
      const categoryLegend = readsLostLegendColors.find(
        legendData => legendData.label === category,
      );
      readsLostSummary.push([
        <CategoricalLegend
          className={cs.inlineLegend}
          data={[categoryLegend]}
          key={`${category}-summary-tooltip`}
        />,
        readsLostData[category].toLocaleString(),
      ]);
    });

    const chartTooltipData = [
      {
        name: "Total reads",
        data: [["Total reads", readsLostData.total.toLocaleString()]],
        disabled: false,
      },
      {
        name: "Reads lost",
        data: readsLostSummary,
        disabled: false,
      },
      {
        name: READS_REMAINING,
        data: [
          [
            <CategoricalLegend
              className={cs.inlineLegend}
              data={[readsRemainingLegend]}
              key={`${READS_REMAINING}-summary-tooltip`}
            />,
            readsLostData[READS_REMAINING].toLocaleString(),
          ],
        ],
        disabled: false,
      },
    ];
    setChartTooltipData(chartTooltipData);
    setTooltipClass(cs.summaryTooltip);
  };

  const handleSampleLabelEnter = sampleName => {
    const chartTooltipData = [
      {
        name: "Info",
        data: [["Sample Name", sampleName]],
        disabled: false,
      },
    ];

    trackEvent(
      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_LABEL_HOVERED,
      {
        sampleName,
      },
    );
    setChartTooltipData(chartTooltipData);
  };

  const handleSampleLabelClick = sampleName => {
    const sampleId = validSamples.find(sample => sample.name === sampleName).id;

    if (sampleId === sidebarParams.sampleId && sidebarVisible === true) {
      setSidebarVisible(false);
      return;
    }

    trackEvent(
      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_LABEL_CLICKED,
      {
        sampleName,
      },
    );

    setSidebarVisible(true);
    setSidebarParams({ sampleId });
  };

  const events = {
    onYAxisLabelClick: handleSampleLabelClick,
    onYAxisLabelEnter: handleSampleLabelEnter,
    onBarStackEnter: handleSingleBarStackEnter,
    onBarEmptySpaceEnter: handleEmptyBarSpaceEnter,
    onChartHover: handleChartElementHover,
    onChartElementExit: handleChartElementExit,
  };

  return (
    <div className={cs.chartsContainer}>
      <div className={cs.fullPageChart}>
        <div data-testid="sample-processed-check" className={cs.title}>
          How were my samples processed through the pipeline?
        </div>
        <div className={cs.histogramContainer}>
          <div data-testid="bar-chart-toggle" className={cs.toggleContainer}>
            <BarChartToggle
              currentDisplay={normalize ? "percentage" : "count"}
              onDisplaySwitch={() => {
                setNormalize(i => !i);
              }}
            />
          </div>
          <div data-testid="read-lost-title" className={cs.subtitle}>
            Reads Lost
            <ColumnHeaderTooltip
              data-testid="read-lost-tooltip"
              trigger={
                <span
                  onFocus={() => {
                    trackEvent(
                      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_INFO_ICON_HOVERED,
                    );
                  }}
                  onMouseOver={() => {
                    trackEvent(
                      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_INFO_ICON_HOVERED,
                    );
                  }}
                >
                  <Icon
                    sdsIcon="infoCircle"
                    sdsSize="s"
                    sdsType="interactive"
                    className={cs.infoIcon}
                  />
                </span>
              }
              title="Reads Lost"
              content={SHARED_SAMPLE_TABLE_COLUMNS.readsLost.tooltip}
              link={SHARED_SAMPLE_TABLE_COLUMNS.readsLost.link}
            />
          </div>
          {readsLostCategories?.length > 0 ? (
            <React.Fragment>
              <CategoricalLegend
                className={cs.legend}
                data={readsLostLegendColors}
              />
              <HorizontalStackedBarChart
                data={readsLostData}
                keys={readsLostCategories}
                options={options}
                events={events}
                yAxisKey={"name"}
                className={cs.stackedBarChart}
                normalize={normalize}
              />
            </React.Fragment>
          ) : (
            <div className={cs.noDataBannerFlexContainer}>
              <InfoBanner
                className={cs.noDataBannerContainer}
                icon={<ImgVizSecondary />}
                link={{
                  href: SHARED_SAMPLE_TABLE_COLUMNS.readsLost.link,
                  text: "Learn about sample QC",
                }}
                message="No reads lost data could be found for your samples."
                title="Reads Lost Visualization"
                type="no_reads_lost_step_data"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
