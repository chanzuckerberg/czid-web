import { compact, isEmpty } from "lodash";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import Tabs from "~/components/ui/controls/Tabs";
import StatusLabel from "~/components/ui/labels/StatusLabel";
import {
  AMR_DEPRECATED_FEATURE,
  MERGED_NT_NR_FEATURE,
  ONT_V1_FEATURE,
} from "~/components/utils/features";
import { findInWorkflows, WORKFLOWS } from "~/components/utils/workflows";
import ReportMetadata from "~/interface/reportMetaData";
import Sample from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { TABS } from "../../constants";
import { getWorkflowCount } from "../../setup";
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

    const mergedNtNrTab = customTab(TABS.MERGED_NT_NR, "Prototype");
    const ontTab = customTab(
      TABS.LONG_READ_MNGS,
      "Beta",
      WORKFLOWS.LONG_READ_MNGS.pluralizedLabel,
    );

    const {
      [WORKFLOWS.SHORT_READ_MNGS.value]: shortReadMngs,
      [WORKFLOWS.LONG_READ_MNGS.value]: longReadMngs,
      [WORKFLOWS.CONSENSUS_GENOME.value]: cg,
      [WORKFLOWS.AMR.value]: amr,
    } = getWorkflowCount(sample);

    const deprecatedAmrLabel =
      allowedFeatures.includes(AMR_DEPRECATED_FEATURE) &&
      reportMetadata.pipelineRunStatus === "SUCCEEDED" &&
      TABS.AMR_DEPRECATED;

    const workflowTabs = compact([
      shortReadMngs && TABS.SHORT_READ_MNGS,
      longReadMngs && allowedFeatures.includes(ONT_V1_FEATURE) && ontTab,
      shortReadMngs &&
        allowedFeatures.includes(MERGED_NT_NR_FEATURE) &&
        mergedNtNrTab,
      shortReadMngs && deprecatedAmrLabel,
      amr && TABS.AMR,
      cg && TABS.CONSENSUS_GENOME,
    ]);
    if (isEmpty(workflowTabs)) {
      return [
        WORKFLOWS[findInWorkflows(sample.initial_workflow, "value")]?.label,
      ];
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
