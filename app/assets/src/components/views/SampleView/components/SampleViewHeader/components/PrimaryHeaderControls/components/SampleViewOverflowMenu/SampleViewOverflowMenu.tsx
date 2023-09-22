import React from "react";
import { bulkDeleteObjects, validateUserCanDeleteObjects } from "~/api";
import { WORKFLOWS, WorkflowType } from "~/components/utils/workflows";
import {
  FINALIZED_SAMPLE_UPLOAD_ERRORS,
  SampleUploadErrors,
} from "~/components/views/samples/constants";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import { OverflowMenu } from "./components/OverflowMenu";
import { SampleViewOverflowMenuConfig } from "./workflowTypeConfig";

interface SampleViewOverflowMenuProps {
  className: string;
  currentRun: WorkflowRun | PipelineRun;
  currentTab: CurrentTabSample;
  onDeleteRunSuccess: () => void;
  reportMetadata: ReportMetadata;
  sample: Sample;
  workflow: WorkflowType;
}

export const SampleViewOverflowMenu = ({
  className,
  currentRun,
  currentTab,
  onDeleteRunSuccess,
  reportMetadata,
  sample,
  workflow,
}: SampleViewOverflowMenuProps) => {
  const { deleteId, readyToDelete, isVisible, isShortReadMngs } =
    SampleViewOverflowMenuConfig[workflow]({
      currentRun,
      reportMetadata,
      sample,
      currentTab,
    });
  if (!isVisible) return;
  const redirectOnSuccess =
    sample && [...sample.pipeline_runs, ...sample.workflow_runs].length === 1;
  const runFinalized =
    currentRun?.run_finalized ||
    FINALIZED_SAMPLE_UPLOAD_ERRORS.includes(
      sample?.upload_error as SampleUploadErrors,
    );
  return (
    <OverflowMenu
      bulkDeleteObjects={(selectedIds: number[]) =>
        bulkDeleteObjects({ selectedIds, workflow })
      }
      className={className}
      deleteId={deleteId}
      isShortReadMngs={isShortReadMngs}
      onDeleteRunSuccess={onDeleteRunSuccess}
      readyToDelete={readyToDelete}
      redirectOnSuccess={redirectOnSuccess}
      runFinalized={runFinalized}
      sampleUserId={sample?.user_id}
      validateUserCanDeleteObjects={(selectedIds: number[]) =>
        validateUserCanDeleteObjects({ selectedIds, workflow })
      }
      workflowShorthand={WORKFLOWS[workflow].shorthand}
      workflowLabel={WORKFLOWS[workflow]?.label}
    />
  );
};
