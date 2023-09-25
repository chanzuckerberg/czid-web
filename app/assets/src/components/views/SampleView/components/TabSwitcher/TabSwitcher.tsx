import { compact, isEmpty } from "lodash";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import Tabs from "~/components/ui/controls/Tabs";
import StatusLabel from "~/components/ui/labels/StatusLabel";
import {
  AMR_DEPRECATED_FEATURE,
  ONT_V1_FEATURE,
} from "~/components/utils/features";
import {
  WORKFLOWS,
  WorkflowType,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import { getWorkflowCount } from "~/components/views/SampleView/utils";
import ReportMetadata from "~/interface/reportMetaData";
import Sample from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import cs from "./tab_switcher.scss";

interface TabSwitcherProps {
  currentTab: CurrentTabSample;
  handleTabChange: (tab: CurrentTabSample) => void;
  reportMetadata: ReportMetadata;
  sample: Sample;
}

export const TabSwitcher = ({
  currentTab,
  handleTabChange,
  reportMetadata,
  sample,
}: TabSwitcherProps) => {
  const computeWorkflowTabs = () => {
    const { allowedFeatures } = useContext(UserContext) || {};

    /* customLabel field was added for long read mNGS
    because the display name does not match the label field passed in the URL
    from DiscoveryView. If another tab is added that needs a customized display name,
    we should think about adding a config to handle tab logic and rendering. */
    const customTab = (
      value: string,
      status: string,
      customLabel?: string,
    ) => ({
      value: value,
      label: (
        <>
          {customLabel || value}
          <StatusLabel
            className={cs.statusLabel}
            inline
            status={status}
            type="beta"
          />
        </>
      ),
    });

    const ontTab = customTab(
      WORKFLOW_TABS.LONG_READ_MNGS,
      "Beta",
      WORKFLOWS[WorkflowType.LONG_READ_MNGS].pluralizedLabel,
    );

    const {
      [WorkflowType.SHORT_READ_MNGS]: shortReadMngs,
      [WorkflowType.LONG_READ_MNGS]: longReadMngs,
      [WorkflowType.CONSENSUS_GENOME]: cg,
      [WorkflowType.AMR]: amr,
    } = getWorkflowCount(sample);

    const deprecatedAmrLabel =
      allowedFeatures.includes(AMR_DEPRECATED_FEATURE) &&
      reportMetadata.pipelineRunStatus === "SUCCEEDED" &&
      WORKFLOW_TABS.AMR_DEPRECATED;

    const workflowTabs = compact([
      shortReadMngs && WORKFLOW_TABS.SHORT_READ_MNGS,
      longReadMngs && allowedFeatures.includes(ONT_V1_FEATURE) && ontTab,
      shortReadMngs && deprecatedAmrLabel,
      amr && WORKFLOW_TABS.AMR,
      cg && WORKFLOW_TABS.CONSENSUS_GENOME,
    ]);
    if (isEmpty(workflowTabs)) {
      return [WORKFLOWS[sample.initial_workflow]?.label];
    } else {
      return workflowTabs;
    }
  };

  return (
    <div className={cs.tabsContainer}>
      {sample && computeWorkflowTabs().length ? (
        <Tabs
          className={cs.tabs}
          tabs={computeWorkflowTabs()}
          value={currentTab}
          onChange={handleTabChange}
        />
      ) : (
        <div className={cs.dividerContainer}>
          <div className={cs.divider} />
        </div>
      )}
    </div>
  );
};
