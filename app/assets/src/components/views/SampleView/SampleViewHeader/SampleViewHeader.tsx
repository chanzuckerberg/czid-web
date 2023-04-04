import { get } from "lodash/fp";
import React, { useContext, useState } from "react";
import { deleteSample } from "~/api";
import { trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import ViewHeader from "~/components/layout/ViewHeader";
import { generateUrlToSampleView } from "~/components/utils/urls";
import {
  WORKFLOWS,
  WORKFLOW_VALUES,
  findInWorkflows,
  isMngsWorkflow,
} from "~/components/utils/workflows";
import Project from "~/interface/project";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import { openUrl } from "~utils/links";
import { NOTIFICATION_TYPES } from "../constants";
import { showNotification } from "../notifications";
import { addSampleDeleteFlagToSessionStorage } from "../utils";
import { PrimaryHeaderControls } from "./PrimaryHeaderControls";
import cs from "./sample_view_header.scss";
import { SampleDeletionConfirmationModal } from "./SampleDeletionConfirmationModal";
import { SecondaryHeaderControls } from "./SecondaryHeaderControls";

interface SampleViewHeaderProps {
  backgroundId?: number;
  currentRun: WorkflowRun | PipelineRun;
  currentTab: CurrentTabSample;
  editable: boolean;
  getDownloadReportTableWithAppliedFiltersLink?: () => string;
  hasAppliedFilters: boolean;
  onDetailsClick: () => void;
  onPipelineVersionChange: (newPipelineVersion: string) => void;
  onShareClick: () => void;
  pipelineVersions?: string[];
  project: Project;
  projectSamples: Pick<Sample, "id" | "name">[];
  reportMetadata: ReportMetadata;
  sample: Sample;
  snapshotShareId?: string;
  view: string;
  onDeleteRunSuccess: () => void;
}

export const SampleViewHeader = ({
  backgroundId,
  currentTab,
  editable,
  getDownloadReportTableWithAppliedFiltersLink,
  hasAppliedFilters,
  onDetailsClick,
  onPipelineVersionChange,
  currentRun,
  project,
  projectSamples = [],
  reportMetadata = {},
  sample,
  snapshotShareId,
  view,
  onShareClick,
  onDeleteRunSuccess,
}: SampleViewHeaderProps) => {
  const userContext = useContext(UserContext);
  const { admin: userIsAdmin } = userContext || {};
  const [
    sampleDeletionConfirmationModalOpen,
    setSampleDeletionConfirmationModalOpen,
  ] = useState(false);

  const handleDeleteSample = async () => {
    const sampleName = sample?.name;
    try {
      await deleteSample(sample?.id);
      addSampleDeleteFlagToSessionStorage(sampleName);
      location.href = `/home?project_id=${project.id}`;
    } catch (error) {
      console.error("error deleting sample", error);
      showNotification(NOTIFICATION_TYPES.sampleDeleteError);
    }
  };

  const getBreadcrumbLink = () => {
    if (!project) return;
    return snapshotShareId
      ? `/pub/${snapshotShareId}`
      : `/home?project_id=${project.id}`;
  };

  const workflow: WORKFLOW_VALUES =
    WORKFLOWS[findInWorkflows(currentTab, "label")]?.value ||
    WORKFLOWS.SHORT_READ_MNGS.value;

  const getAllRunsPerWorkflow = () => {
    const runsByType =
      get("workflow_runs", sample) &&
      get("workflow_runs", sample).filter(run => run.workflow === workflow);
    return isMngsWorkflow(workflow) ? get("pipeline_runs", sample) : runsByType;
  };

  return (
    <>
      <ViewHeader className={cs.viewHeader}>
        <ViewHeader.Content>
          <ViewHeader.Pretitle breadcrumbLink={getBreadcrumbLink()}>
            {project ? project.name : ""}
          </ViewHeader.Pretitle>
          <ViewHeader.Title
            label={get("name", sample)}
            id={sample && sample?.id}
            options={projectSamples.map(sample => ({
              label: sample?.name,
              id: sample?.id,
              onClick: () => {
                openUrl(
                  generateUrlToSampleView({
                    sampleId: sample?.id,
                    snapshotShareId,
                  }),
                );
                trackEvent("SampleView_header-title_clicked", {
                  sampleId: sample?.id,
                });
              },
            }))}
          />
        </ViewHeader.Content>
        {!snapshotShareId && (
          <ViewHeader.Controls>
            <SecondaryHeaderControls
              sample={sample}
              currentRun={currentRun}
              getAllRuns={getAllRunsPerWorkflow}
              workflow={workflow}
              onPipelineVersionChange={onPipelineVersionChange}
              userIsAdmin={userIsAdmin}
              onDetailsClick={onDetailsClick}
            />
            <PrimaryHeaderControls
              backgroundId={backgroundId}
              currentRun={currentRun}
              currentTab={currentTab}
              editable={editable}
              getDownloadReportTableWithAppliedFiltersLink={
                getDownloadReportTableWithAppliedFiltersLink
              }
              hasAppliedFilters={hasAppliedFilters}
              onDeleteSample={() =>
                setSampleDeletionConfirmationModalOpen(true)
              }
              onShareClick={onShareClick}
              onDeleteRunSuccess={onDeleteRunSuccess}
              reportMetadata={reportMetadata}
              sample={sample}
              view={view}
              workflow={workflow}
            />
          </ViewHeader.Controls>
        )}
      </ViewHeader>
      {sampleDeletionConfirmationModalOpen && (
        <SampleDeletionConfirmationModal
          open
          onCancel={() => setSampleDeletionConfirmationModalOpen(false)}
          onConfirm={handleDeleteSample}
        />
      )}
    </>
  );
};
