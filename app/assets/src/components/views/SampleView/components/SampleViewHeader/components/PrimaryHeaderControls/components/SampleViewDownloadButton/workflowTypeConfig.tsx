import { get, isEmpty } from "lodash/fp";
import { WorkflowConfigType, WorkflowType } from "~/components/utils/workflows";
import ReportMetadata from "~/interface/reportMetaData";
import { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import {
  AmrDownloadDropdown,
  AmrDownloadDropdownProps,
} from "./components/AmrDownloadDropdown";
import {
  BenchmarkDownloadDropdown,
  BenchmarkDownloadDropdownProps,
} from "./components/BenchmarkDownloadDropdown";
import {
  DownloadAllButton,
  DownloadAllButtonProps,
} from "./components/DownloadAllButton";
import {
  MngsDownloadDropdown,
  MngsDownloadDropdownProps,
} from "./components/MngsDownloadDropdown";

type AmrDownloadDropdownType = (props: AmrDownloadDropdownProps) => JSX.Element;
type BenchmarkDownloadDropdownType = (
  props: BenchmarkDownloadDropdownProps,
) => JSX.Element;
type DownloadAllButtonType = (props: DownloadAllButtonProps) => JSX.Element;
type MngsDownloadDropdownType = (
  props: MngsDownloadDropdownProps,
) => JSX.Element;

type SampleViewDownloadButtonConfigType = (x: {
  currentRun: WorkflowRun | PipelineRun;
  reportMetadata: ReportMetadata;
  currentTab: CurrentTabSample;
}) => {
  component:
    | AmrDownloadDropdownType
    | BenchmarkDownloadDropdownType
    | DownloadAllButtonType
    | MngsDownloadDropdownType;
  readyToDownload: boolean;
};

export const SampleViewDownloadButtonConfig: WorkflowConfigType<SampleViewDownloadButtonConfigType> =
  {
    [WorkflowType.AMR]: ({ currentRun }) => ({
      component: AmrDownloadDropdown,
      readyToDownload: currentRun && get("status", currentRun) === "SUCCEEDED",
    }),
    [WorkflowType.CONSENSUS_GENOME]: ({ currentRun }) => ({
      component: DownloadAllButton,
      readyToDownload: currentRun && get("status", currentRun) === "SUCCEEDED",
    }),
    [WorkflowType.SHORT_READ_MNGS]: ({ reportMetadata }) => ({
      component: MngsDownloadDropdown,
      readyToDownload: !isEmpty(reportMetadata),
    }),
    [WorkflowType.LONG_READ_MNGS]: ({ reportMetadata }) => ({
      component: MngsDownloadDropdown,
      readyToDownload: !isEmpty(reportMetadata),
    }),
    [WorkflowType.BENCHMARK]: currentRun => ({
      component: BenchmarkDownloadDropdown,
      readyToDownload: currentRun && get("status", currentRun) === "SUCCEEDED",
    }),
    [WorkflowType.AMR_DEPRECATED]: ({ reportMetadata }) => ({
      component: MngsDownloadDropdown,
      readyToDownload: !isEmpty(reportMetadata),
    }),
  };
