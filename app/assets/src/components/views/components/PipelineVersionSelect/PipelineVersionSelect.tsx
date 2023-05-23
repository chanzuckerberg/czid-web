import { get } from "lodash/fp";
import moment from "moment";
import React from "react";
import { Popup } from "semantic-ui-react";
import { trackEvent } from "~/api/analytics";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import { findInWorkflows, WORKFLOWS } from "~/components/utils/workflows";
import { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import cs from "./pipeline_version_select.scss";

interface PipelineVersionSelectProps {
  sampleId?: number;
  shouldIncludeDatabaseVersion: boolean;
  currentRun?: WorkflowRun | PipelineRun;
  allRuns?: WorkflowRun[] | PipelineRun[] | string[];
  workflowType?: string;
  versionKey?: string;
  timeKey?: string;
  onVersionChange: $TSFixMeFunction;
}

export const PipelineVersionSelect = (props: PipelineVersionSelectProps) => {
  const {
    sampleId,
    shouldIncludeDatabaseVersion = false,
    currentRun,
    allRuns = [],
    workflowType,
    versionKey,
    timeKey,
    onVersionChange,
  } = props;

  // gather data for pipeline version and last processed

  const lastProcessedAt = currentRun?.[timeKey];
  const currentPipelineVersion = currentRun ? currentRun[versionKey] : "";

  // if the pipeline never finished processing, return null
  if (!lastProcessedAt || !currentPipelineVersion) return null;

  // the pipeline viz header provides other versions as a list of strings, not PipelineRuns or WorkflowRuns
  const allPipelineVersions: string[] =
    allRuns.length > 0 && typeof allRuns[0] === "string"
      ? allRuns
      : [...new Set(allRuns?.map(run => run[versionKey]))];

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

  const getDatabaseVersionString = () => {
    if (!shouldIncludeDatabaseVersion) return "";
    let dbVersion = get("version.alignment_db", currentRun);
    if (workflowType === "amr") {
      dbVersion = "CARD DB: 3.2.3";
    }
    return dbVersion ? `${dbVersion} | ` : "";
  };

  const getWorkflowVersionString = () => {
    if (!currentRun[versionKey]) return "";

    const workflowKey = findInWorkflows(workflowType, "value");
    // we special case abbreviate AMR because it's so long
    const workflowName =
      workflowType === "amr" ? "AMR" : WORKFLOWS[workflowKey].pipelineName;

    return `${workflowName} Pipeline v${currentRun[versionKey]}`;
  };

  // construct the header
  const renderSingleVersionTextHeader = () => {
    return (
      <>
        <Popup
          content={"This is the only version available."}
          position={"top center"}
          inverted={false}
          trigger={
            <span
              className={cs.pipelineVersion}
              data-testid="pipeline-version-select"
            >
              {getWorkflowVersionString()}
            </span>
          }
        />

        <span className={cs.pipelineVersion}>
          {` | ${getDatabaseVersionString()}${getLastProcessedString()}`}
        </span>
      </>
    );
  };

  const renderMultipleVersionsDropdownHeader = () => {
    const options = otherPipelineVersions.map(version => ({
      text: `Pipeline v${version} `,
      value: version,
    }));

    const onPipelineVersionSelect = (version: string) => {
      trackEvent("SampleView_pipeline-select_clicked", {
        sampleId,
        pipelineVersion: version,
        workflowType,
      });
      onVersionChange(version);
    };

    return (
      <>
        <Popup
          content={"Select pipeline version."}
          position={"top center"}
          inverted={true}
          trigger={
            <BareDropdown
              className={cs.pipelineVersionDropdown}
              trigger={
                <span className={cs.pipelineVersionDropdown}>
                  {`${getWorkflowVersionString()}`}
                </span>
              }
              options={options}
              onChange={(version: string) => onPipelineVersionSelect(version)}
              smallArrow={true}
              arrowInsideTrigger={false}
              data-testid="pipeline-version-select"
            />
          }
        />
        <span
          className={cs.pipelineVersion}
        >{` | ${getDatabaseVersionString()}${getLastProcessedString()}`}</span>
      </>
    );
  };

  // figure out which version of the header to use and return it
  // only one version, and it's the current one? return a string rather than a dropdown.
  if (
    allPipelineVersions.length === 0 ||
    (allPipelineVersions.length === 1 &&
      allPipelineVersions[0] === currentPipelineVersion)
  ) {
    return (
      <div className={cs.pipelineVersionSelectContainer}>
        {renderSingleVersionTextHeader()}
      </div>
    );
  } else {
    // multiple versions? create dropdown

    return (
      <div className={cs.pipelineVersionSelectContainer}>
        {renderMultipleVersionsDropdownHeader()}
      </div>
    );
  }
};

export default PipelineVersionSelect;
