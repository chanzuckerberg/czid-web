import { useQuery } from "@apollo/client";
import cx from "classnames";
import { get } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import DetailsSidebar from "~/components/common/DetailsSidebar/DetailsSidebar";
import { SampleDetailsModeProps } from "~/components/common/DetailsSidebar/SampleDetailsMode";
import ImgVizSecondary from "~/components/ui/illustrations/ImgVizSecondary";
import { getTooltipStyle } from "~/components/utils/tooltip";
import { WorkflowType } from "~/components/utils/workflows";
import Sample from "~/interface/sample";
import { TooltipVizTable } from "~ui/containers";
import { QUALITY_CONTROL_QUERY } from "../api/quality_control";
import InfoBanner from "../InfoBanner";
import { Histograms } from "./components/Histograms";
import { ReadsLostChart } from "./components/ReadsLostChart";
import { SampleStatsInfo } from "./components/SampleStatsInfo";
import cs from "./quality_control.scss";

interface QualityControlWrapperProps {
  filters?: { host: $TSFixMeUnknown };
  projectId?: number;
  handleBarClick: $TSFixMeFunction;
  sampleStatsSidebarOpen?: boolean;
  filtersSidebarOpen?: boolean;
}

// TODO: get rid of this wrapper once the graphql
// conversion for getSamples and getSamplesReadStats
// is complete
function QualityControlWrapper(props: QualityControlWrapperProps) {
  const { loading, error, data } = useQuery(QUALITY_CONTROL_QUERY, {
    variables: {
      projectId: props.projectId,
      workflow: WorkflowType.SHORT_READ_MNGS,
      hostIds: props.filters.host,
      ...props.filters,
    },
  });
  if (loading) return <span>Loading...</span>;
  if (error) return <span>`Error! ${error.message}`</span>;

  return (
    <QualityControl
      project={data.project}
      samples={data.samplesList.samples}
      {...props}
    />
  );
}

interface QualityControlProps {
  filters?: object;
  projectId?: number;
  handleBarClick: $TSFixMeFunction;
  sampleStatsSidebarOpen?: boolean;
  filtersSidebarOpen?: boolean;
  project?: object;
  samples: Sample[];
}

function QualityControl({
  filters,
  samples,
  handleBarClick,
}: QualityControlProps) {
  const trackEvent = useTrackEvent();
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarParams, setSidebarParams] = useState<SampleDetailsModeProps>({
    sampleId: null,
  });
  const [failedSamples, setFailedSamples] = useState(null);
  const [totalSampleCount, setTotalSampleCount] = useState(null);
  const [samplesDict, setSamplesDict] = useState(null);
  const [tooltipLocation, setTooltipLocation] = useState(null);
  const [tooltipClass, setTooltipClass] = useState(null);
  const [validSamples, setValidSamples] = useState(null);
  const [runningSamples, setRunningSamples] = useState(null);
  const [chartTooltipData, setChartTooltipData] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, []);

  const fetchProjectData = async () => {
    setLoading(true);
    const data = extractData(samples);
    const totalSampleCount =
      data.validSamples.length +
      data.runningSamples.length +
      data.failedSamples.length;

    setValidSamples(data.validSamples);
    setRunningSamples(data.runningSamples);
    setFailedSamples(data.failedSamples);
    setSamplesDict(data.samplesDict);
    setTotalSampleCount(totalSampleCount);
    setLoading(false);
  };

  function extractData(samples) {
    const validSamples = [];
    const runningSamples = [];
    const failedSamples = [];
    const samplesDict = {};

    samples.forEach(sample => {
      // PLQC is only for samples with an mNGS pipeline run
      // The `created_at` field is only present+filled for a workflow run type
      // if the sample has a workflow run of that type, so we check if the sample
      // has `created_at` filled for mNGS.
      if (get("mngsRunInfo.createdAt", sample.details)) {
        const runInfo =
          get("uploadError", sample.details) ||
          get("mngsRunInfo", sample.details);
        if (
          runInfo.resultStatusDescription === "FAILED" ||
          runInfo.resultStatusDescription === "COMPLETE - ISSUE" ||
          runInfo.resultStatusDescription === "COMPLETE*"
        ) {
          failedSamples.push(sample);
        } else if (
          runInfo.reportReady &&
          sample.details.derivedSampleOutput.summaryStats
        ) {
          validSamples.push(sample);
          samplesDict[sample.id] = sample;
        } else {
          runningSamples.push(sample);
        }
      }
    });

    return {
      validSamples,
      runningSamples,
      failedSamples,
      samplesDict,
    };
  }

  /** callback functions **/

  const handleChartElementHover = (clientX, clientY) => {
    const tooltipLocation =
      clientX && clientY ? { left: clientX, top: clientY } : null;
    trackEvent(
      ANALYTICS_EVENT_NAMES.QUALITY_CONTROL_STACKED_BAR_CHART_BAR_HOVERED,
    );
    setTooltipLocation(tooltipLocation);
  };

  const handleChartElementExit = () => {
    setTooltipLocation(null);
    setTooltipClass(null);
    setChartTooltipData(null);
  };

  /* --- render functions --- */

  function renderLoading() {
    return (
      <div className={cs.content}>
        <p>
          <i className="fa fa-spinner fa-pulse fa-fw" />
          Loading...
        </p>
      </div>
    );
  }

  function renderVisualization() {
    const showBlankState = !loading && validSamples.length === 0;

    return showBlankState ? (
      <div className={cs.noDataBannerFlexContainer}>
        <InfoBanner
          className={cs.noDataBannerContainer}
          icon={<ImgVizSecondary />}
          link={{
            href: "https://help.czid.org",
            text: "Learn about sample QC",
          }}
          message="You can visually check your QC metrics after your samples have successfully processed."
          title="Sample QC Visualizations"
          type="no_successful_samples"
        />
      </div>
    ) : (
      <div className={cs.content}>
        <div className={cs.histogramSection}>
          <SampleStatsInfo
            runningSamples={runningSamples}
            failedSamples={failedSamples}
            validSamples={validSamples}
            totalSampleCount={totalSampleCount}
          />
          <Histograms
            filters={filters}
            validSamples={validSamples}
            samplesDict={samplesDict}
            loading={loading}
            fetchProjectData={fetchProjectData}
            handleBarClick={handleBarClick}
            handleChartElementHover={handleChartElementHover}
            handleChartElementExit={handleChartElementExit}
            setChartTooltipData={setChartTooltipData}
          />
        </div>
        <div className={cs.readsLostSection}>
          <ReadsLostChart
            validSamples={validSamples}
            handleChartElementHover={handleChartElementHover}
            handleChartElementExit={handleChartElementExit}
            setChartTooltipData={setChartTooltipData}
            setTooltipClass={setTooltipClass}
            setSidebarVisible={setSidebarVisible}
            setSidebarParams={setSidebarParams}
            sidebarParams={sidebarParams}
            sidebarVisible={sidebarVisible}
          />
        </div>
        <DetailsSidebar
          visible={sidebarVisible}
          mode="sampleDetails"
          params={sidebarParams}
          onClose={() => setSidebarVisible(false)}
        />
        {tooltipLocation && chartTooltipData && (
          <div
            data-testid="hover-tooltip"
            style={getTooltipStyle(tooltipLocation)}
            className={cx(cs.hoverTooltip, tooltipClass)}
          >
            <TooltipVizTable data={chartTooltipData} />
          </div>
        )}
      </div>
    );
  }

  return loading ? renderLoading() : renderVisualization();
}

export default QualityControlWrapper;
