import cx from "classnames";
import { get } from "lodash/fp";
import React, { useCallback, useEffect, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import DetailsSidebar from "~/components/common/DetailsSidebar/DetailsSidebar";
import { SampleDetailsModeProps } from "~/components/common/DetailsSidebar/SampleDetailsMode";
import { InfoBanner } from "~/components/common/InfoBanner";
import { LoadingPage } from "~/components/common/LoadingPage";
import ImgVizSecondary from "~/components/ui/illustrations/ImgVizSecondary";
import { getTooltipStyle } from "~/components/utils/tooltip";
import { WorkflowType } from "~/components/utils/workflows";
import { TooltipVizTable } from "~ui/containers";
import { Histograms } from "./components/Histograms";
import { ReadsLostChart } from "./components/ReadsLostChart";
import { SampleStatsInfo } from "./components/SampleStatsInfo";
import cs from "./quality_control.scss";
import {
  QualityControlQuery as QualityControlQueryType,
  QualityControlQuery$data,
} from "./__generated__/QualityControlQuery.graphql";

const QualityControlQuery = graphql`
  query QualityControlQuery(
    $projectId: Int!
    # $search: String!
    $domain: String
    $limit: Int
    $offset: Int
    $orderBy: String
    $orderDir: String
    $listAllIds: Boolean
    $basic: Boolean
    $sampleIds: [Int!]
    $hostIds: [Int!]
    $location: String
    $locationV2: [String!]
    $taxIds: [Int!]
    $taxLevels: [String!]
    $thresholdFilterInfo: String
    $annotations: [Annotation!]
    $time: [String!]
    $tissue: [String!]
    $visibility: [String!]
    $searchString: String
    $requestedSampleIds: [Int!]
    $workflow: String
  ) {
    samplesList(
      projectId: $projectId
      # search: $search
      domain: $domain
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDir: $orderDir
      listAllIds: $listAllIds
      basic: $basic
      sampleIds: $sampleIds
      hostIds: $hostIds
      location: $location
      locationV2: $locationV2
      taxIds: $taxIds
      taxLevels: $taxLevels
      thresholdFilterInfo: $thresholdFilterInfo
      annotations: $annotations
      time: $time
      tissue: $tissue
      visibility: $visibility
      searchString: $searchString
      requestedSampleIds: $requestedSampleIds
      workflow: $workflow
    ) {
      samples {
        id
        name
        details {
          dbSample {
            uploadError
          }
          derivedSampleOutput {
            pipelineRun {
              totalReads
            }
            summaryStats {
              compressionRatio
              qcPercent
              insertSizeMean
            }
          }
          mngsRunInfo {
            resultStatusDescription
            reportReady
            createdAt
          }
        }
      }
    }
  }
`;

interface QualityControlProps {
  filters?: { host: number[] };
  projectId: string;
  handleBarClick: $TSFixMeFunction;
  sampleStatsSidebarOpen?: boolean;
  filtersSidebarOpen?: boolean;
}

function QualityControl({
  filters,
  projectId,
  handleBarClick,
}: QualityControlProps) {
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarParams, setSidebarParams] = useState<SampleDetailsModeProps>({
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    sampleId: null,
  });
  const [totalSampleCount, setTotalSampleCount] = useState<number | null>(null);
  const [samplesDict, setSamplesDict] = useState({});
  const [validSamples, setValidSamples] = useState([]);
  const [runningSamples, setRunningSamples] = useState([]);
  const [failedSamples, setFailedSamples] = useState([]);
  const [chartTooltipData, setChartTooltipData] = useState(null);
  const [tooltipLocation, setTooltipLocation] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [tooltipClass, setTooltipClass] = useState(null);
  const data = useLazyLoadQuery<QualityControlQueryType>(QualityControlQuery, {
    projectId: parseInt(projectId), // TODO: this should be a string, but the query expects an int
    workflow: WorkflowType.SHORT_READ_MNGS,
    hostIds: filters?.host,
    ...filters,
  });
  const samples = data.samplesList.samples;

  const fetchProjectData = useCallback(async () => {
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
  }, [samples]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  function extractData(
    samples: QualityControlQuery$data["samplesList"]["samples"],
  ) {
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          failedSamples.push(sample);
        } else if (
          runInfo.reportReady &&
          sample.details.derivedSampleOutput?.summaryStats
        ) {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          validSamples.push(sample);
          samplesDict[sample.id] = sample;
        } else {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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

  const handleChartElementHover = (clientX: number, clientY: number) => {
    const tooltipLocation =
      clientX && clientY ? { left: clientX, top: clientY } : null;
    setTooltipLocation(tooltipLocation);
  };

  const handleChartElementExit = () => {
    setTooltipLocation(null);
    setTooltipClass(null);
    setChartTooltipData(null);
  };

  if (loading) return <LoadingPage />;

  return validSamples?.length > 0 ? (
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
  ) : (
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
  );
}

export default QualityControl;
