import { get, isEmpty, size } from "lodash/fp";
import React, { useContext, useState } from "react";
import { saveVisualization } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  withAnalytics,
  trackEvent,
} from "~/api/analytics";

import { UserContext } from "~/components/common/UserContext";

import {
  showAppcue,
  SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
} from "~/components/utils/appcues";

import {
  AMR_V2_FEATURE,
  BULK_DELETION_FEATURE,
} from "~/components/utils/features";
import {
  WORKFLOWS,
  WORKFLOW_VALUES,
  isMngsWorkflow,
} from "~/components/utils/workflows";
import { getWorkflowRunZipLink } from "~/components/views/report/utils/download";
import { parseUrlParams } from "~/helpers/url";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { PipelineRun } from "~/interface/shared";
import {
  DownloadButton,
  ErrorButton,
  HelpButton,
  SaveButton,
} from "~ui/controls/buttons";
import { openUrl } from "~utils/links";
import { TABS } from "../../constants";
import { DownloadDropdown } from "./DownloadDropdown";
import { OverflowMenu } from "./OverflowMenu";
import { ShareButtonPopUp } from "./ShareButtonPopUp";

import cs from "./primary_header_controls.scss";

interface PrimaryHeaderControlsProps {
  backgroundId?: number;
  currentRun: WorkflowRun | PipelineRun;
  currentTab: CurrentTabSample;
  editable: boolean;
  getDownloadReportTableWithAppliedFiltersLink?: () => string;
  hasAppliedFilters: boolean;
  onDeleteSample: () => void;
  onShareClick: () => void;
  onDeleteRunSuccess: () => void;
  reportMetadata: ReportMetadata;
  sample: Sample;
  view: string;
  workflow: WORKFLOW_VALUES;
}

export const PrimaryHeaderControls = ({
  backgroundId,
  currentRun,
  currentTab,
  editable,
  getDownloadReportTableWithAppliedFiltersLink,
  hasAppliedFilters,
  onDeleteSample,
  onShareClick,
  reportMetadata,
  sample,
  view,
  workflow,
  onDeleteRunSuccess,
}: PrimaryHeaderControlsProps) => {
  const { allowedFeatures, admin: userIsAdmin, userId } =
    useContext(UserContext) || {};
  const succeeded = get("status", currentRun) === "SUCCEEDED";
  const runIsLoaded = !isEmpty(reportMetadata);
  const hasBulkDeletion = allowedFeatures.includes(BULK_DELETION_FEATURE);
  const sampleDeletable = sample?.sample_deletable;

  const [showOverflowButton, setShowOverflowButton] = useState(false);

  const onDownloadAll = (eventName: "amr" | "consensus-genome") => {
    openUrl(getWorkflowRunZipLink(currentRun.id));
    trackEvent(`SampleViewHeader_${eventName}-download-all-button_clicked`, {
      sampleId: sample?.id,
    });
  };

  const onSaveClick = async () => {
    if (view) {
      const params = parseUrlParams();
      params.sampleIds = sample?.id;
      await saveVisualization(view, params);
    }
  };

  const renderDeleteSampleButton = () => {
    return (
      <ErrorButton
        text="Delete Sample"
        onClick={onDeleteSample}
        className={cs.controlElement}
      />
    );
  };

  const renderDownloadAll = (workflow: "amr" | "consensus-genome") => {
    return (
      succeeded && (
        <DownloadButton
          className={cs.controlElement}
          text="Download All"
          onClick={() => onDownloadAll(workflow)}
          primary={workflow === WORKFLOWS.AMR.value}
        />
      )
    );
  };

  const renderDownloadButton = () => {
    switch (workflow) {
      case WORKFLOWS.LONG_READ_MNGS.value:
      case WORKFLOWS.SHORT_READ_MNGS.value:
        if (!!reportMetadata.reportReady && currentRun) {
          return renderDownloadDropdown();
        } else if (!isEmpty(reportMetadata) && editable && sampleDeletable) {
          return renderDeleteSampleButton();
        }
        break;
      case WORKFLOWS.CONSENSUS_GENOME.value:
        if (succeeded) {
          return renderDownloadAll(workflow);
        } else if (
          editable &&
          sampleDeletable &&
          isEmpty(sample?.pipeline_runs) // if there are no mNGS runs
        ) {
          return renderDeleteSampleButton();
        }
        break;
      case WORKFLOWS.AMR.value:
        if (succeeded) {
          return renderDownloadAll(workflow);
        }
        break;
    }
  };

  const renderDownloadButtonUpdated = () => {
    // created `renderDownloadButtonUpdated` to change the logic of the delete sample button behind the feature flag
    // this will eventually replace renderDownloadButton for all users

    const remainingWorkflowRuns =
      !isMngsWorkflow(workflow) &&
      sample?.workflow_runs?.filter(run => run.id !== currentRun?.id);

    switch (workflow) {
      case WORKFLOWS.LONG_READ_MNGS.value:
      case WORKFLOWS.SHORT_READ_MNGS.value:
        if (!!reportMetadata.reportReady && currentRun) {
          !showOverflowButton && setShowOverflowButton(true);
          return renderDownloadDropdown();
        } else if (!isEmpty(reportMetadata) && editable && sampleDeletable) {
          showOverflowButton && setShowOverflowButton(false);
          return renderDeleteSampleButton();
        }
        break;
      case WORKFLOWS.CONSENSUS_GENOME.value:
      case WORKFLOWS.AMR.value:
        if (succeeded) {
          !showOverflowButton && setShowOverflowButton(true);
          return renderDownloadAll(workflow);
        } else if (
          editable &&
          sampleDeletable &&
          isEmpty(sample?.pipeline_runs) && // if there are no mNGS runs
          remainingWorkflowRuns.length === 0 // if there are no other workflow runs
        ) {
          showOverflowButton && setShowOverflowButton(false);
          return renderDeleteSampleButton();
        }
        break;
    }
  };

  const renderDownloadDropdown = () => {
    return (
      runIsLoaded && (
        <DownloadDropdown
          className={cs.controlElement}
          backgroundId={backgroundId}
          currentTab={currentTab}
          getDownloadReportTableWithAppliedFiltersLink={
            getDownloadReportTableWithAppliedFiltersLink
          }
          hasAppliedFilters={hasAppliedFilters}
          pipelineRun={currentRun as PipelineRun}
          sample={sample}
          view={view}
        />
      )
    );
  };

  const renderHelpButton = () => {
    // CG help button should only be shown if feature flag is on
    // unless the sample has 0 mNGS runs & exactly 1 CG run.
    const shouldHideConsensusGenomeHelpButton =
      !allowedFeatures.includes("cg_appcues_help_button") ||
      (sample &&
        isEmpty(sample?.pipeline_runs) &&
        size(sample?.workflow_runs) === 1);

    if (
      workflow === WORKFLOWS.AMR.value ||
      workflow === WORKFLOWS.LONG_READ_MNGS.value ||
      (workflow === WORKFLOWS.CONSENSUS_GENOME.value &&
        shouldHideConsensusGenomeHelpButton)
    ) {
      return;
    }

    // format appCueFlowId and anaylticsEventName based on workflow
    const appCueFlowId = {
      [WORKFLOWS.SHORT_READ_MNGS.value]: SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
      [WORKFLOWS.CONSENSUS_GENOME.value]: SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
    };

    const anaylticsEventName = {
      [WORKFLOWS.SHORT_READ_MNGS.value]:
        ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_MNGS_HELP_BUTTON_CLICKED,
      [WORKFLOWS.CONSENSUS_GENOME.value]:
        ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HEADER_CONSENSUS_GENOME_HELP_BUTTON_CLICKED,
    };

    return (
      runIsLoaded && (
        <HelpButton
          className={cs.controlElement}
          onClick={showAppcue({
            flowId: appCueFlowId[workflow],
            analyticEventName: anaylticsEventName[workflow],
          })}
        />
      )
    );
  };

  const renderSaveButton = () => {
    switch (workflow) {
      case WORKFLOWS.LONG_READ_MNGS.value:
      case WORKFLOWS.SHORT_READ_MNGS.value:
        return (
          userIsAdmin && (
            <SaveButton
              className={cs.controlElement}
              onClick={withAnalytics(
                onSaveClick,
                "SampleView_save-button_clicked",
                {
                  sampleId: sample?.id,
                },
              )}
            />
          )
        );
      default:
        return null;
    }
  };

  const renderShareButton = () => {
    switch (workflow) {
      case WORKFLOWS.LONG_READ_MNGS.value:
      case WORKFLOWS.SHORT_READ_MNGS.value:
        return runIsLoaded && <ShareButtonPopUp onShareClick={onShareClick} />;
      case WORKFLOWS.CONSENSUS_GENOME.value:
        return succeeded && <ShareButtonPopUp onShareClick={onShareClick} />;
      case WORKFLOWS.AMR.value:
        return (
          allowedFeatures.includes(AMR_V2_FEATURE) && (
            <ShareButtonPopUp onShareClick={onShareClick} />
          )
        );
      default:
        return null;
    }
  };

  const renderOverflowMenu = () => {
    const redirectOnSuccess =
      sample && [...sample.pipeline_runs, ...sample.workflow_runs].length === 1;
    return (
      hasBulkDeletion &&
      showOverflowButton &&
      currentTab !== TABS.AMR_DEPRECATED && (
        <OverflowMenu
          className={cs.controlElement}
          workflow={workflow}
          deleteId={isMngsWorkflow(workflow) ? sample?.id : currentRun?.id}
          onDeleteRunSuccess={onDeleteRunSuccess}
          runFinalized={currentRun?.run_finalized}
          userOwnsRun={userId === sample?.user_id}
          redirectOnSuccess={redirectOnSuccess}
        />
      )
    );
  };

  return (
    <>
      <div className={cs.controlsBottomRowContainer}>
        {renderShareButton()}
        {renderSaveButton()}
        {!hasBulkDeletion
          ? renderDownloadButton()
          : renderDownloadButtonUpdated()}
        {renderHelpButton()}
        {renderOverflowMenu()}
      </div>
    </>
  );
};
