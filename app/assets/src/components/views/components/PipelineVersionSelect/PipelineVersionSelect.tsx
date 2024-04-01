import moment from "moment";
import React from "react";
import { useAllowedFeatures } from "~/components/common/UserContext";
import { SHOULD_READ_FROM_NEXTGEN } from "~/components/utils/features";
import { WorkflowType } from "~/components/utils/workflows";
import { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import { MultipleVersionsDropdownHeader } from "./components/MultipleVersionsDropdownHeader";
import { SingleVersionTextHeader } from "./components/SingleVersionTextHeader";
import cs from "./pipeline_version_select.scss";
import { PipelineVersionSelectConfig } from "./workflowTypeConfig";

interface PipelineVersionSelectProps {
  currentRun?: WorkflowRun | PipelineRun;
  allRuns?:
    | readonly (PipelineRun | null | undefined)[]
    | (WorkflowRun | null | undefined)[]
    | string[]
    | null;
  workflowType: WorkflowType;
  onVersionChange: (x: string) => void;
}

export const PipelineVersionSelect = ({
  currentRun,
  allRuns = [],
  workflowType,
  onVersionChange,
}: PipelineVersionSelectProps) => {
  const allowedFeatures = useAllowedFeatures();

  const { timeKey, versionKey, workflowName, getDatabaseVersionString } =
    PipelineVersionSelectConfig[workflowType];

  // gather data for pipeline version and last processed
  const lastProcessedAt = currentRun?.[timeKey];
  const currentPipelineVersion = currentRun?.[versionKey];

  // if the pipeline never finished processing, return null
  if (!lastProcessedAt || !currentPipelineVersion) return null;

  const allPipelineVersions: string[] =
    allRuns && allRuns.length > 0 && typeof allRuns[0] === "string"
      ? (allRuns as string[])
      : ([...new Set(allRuns?.map(run => run[versionKey]))] as string[]);

  const otherPipelineVersions = allPipelineVersions.filter(
    (otherPipelineVersion: string) =>
      currentPipelineVersion !== otherPipelineVersion,
  );

  // grab strings for last processed date and workflow version
  const getLastProcessedString = () => {
    const lastProcessedFormattedDate = moment(lastProcessedAt)
      .startOf("second")
      .fromNow();

    return ` processed ${lastProcessedFormattedDate} |`;
  };

  const onPipelineVersionSelect = (version: string) => {
    onVersionChange(version);
  };

  const currentPipelineString =
    currentRun[versionKey] &&
    `${workflowName} Pipeline v${currentRun[versionKey]}`;
  const versionInfoString = ` | ${getDatabaseVersionString(
    currentRun,
  )}${getLastProcessedString()}`;
  // figure out which version of the header to use and return it
  // only one version, and it's the current one? return a string rather than a dropdown.
  const showSingleVersionTextHeader =
    allPipelineVersions.length === 0 ||
    (allPipelineVersions.length === 1 &&
      allPipelineVersions[0] === currentPipelineVersion) ||
    (allowedFeatures.includes(SHOULD_READ_FROM_NEXTGEN) &&
      workflowType === WorkflowType.CONSENSUS_GENOME);

  return (
    <div className={cs.pipelineVersionSelectContainer}>
      {showSingleVersionTextHeader ? (
        <SingleVersionTextHeader
          currentPipelineString={currentPipelineString}
          versionInfoString={versionInfoString}
        />
      ) : (
        <MultipleVersionsDropdownHeader
          currentPipelineString={currentPipelineString}
          otherPipelineVersions={otherPipelineVersions}
          onPipelineVersionSelect={onPipelineVersionSelect}
          versionInfoString={versionInfoString}
        />
      )}
    </div>
  );
};
