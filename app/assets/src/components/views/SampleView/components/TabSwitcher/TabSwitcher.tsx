import { compact, isEmpty } from "lodash";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import Tabs from "~/components/ui/controls/Tabs";
import { AMR_DEPRECATED_FEATURE } from "~/components/utils/features";
import {
  WORKFLOWS,
  WorkflowType,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import { getWorkflowCount } from "~/components/views/SampleView/utils";
import { ReportMetadata } from "~/interface/reportMetaData";
import Sample from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import cs from "./tab_switcher.scss";

interface TabSwitcherProps {
  currentTab: CurrentTabSample;
  handleTabChange: (tab: CurrentTabSample) => void;
  reportMetadata: ReportMetadata;
  sample: Sample | null;
}

export const TabSwitcher = ({
  currentTab,
  handleTabChange,
  reportMetadata,
  sample,
}: TabSwitcherProps) => {
  const computeWorkflowTabs = (sample: Sample) => {
    const { allowedFeatures } = useContext(UserContext) || {};

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
      longReadMngs && WORKFLOW_TABS.LONG_READ_MNGS,
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
      {sample && computeWorkflowTabs(sample).length ? (
        <Tabs
          className={cs.tabs}
          tabs={computeWorkflowTabs(sample)}
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
