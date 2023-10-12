import { compact, find, get, size } from "lodash/fp";
import React from "react";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { SampleDetailsModeProps } from "~/components/common/DetailsSidebar/SampleDetailsMode";
import { TaxonDetailsModeProps } from "~/components/common/DetailsSidebar/TaxonDetailsMode";
import { WorkflowType, WORKFLOW_TABS } from "~/components/utils/workflows";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import { Background, PipelineRun, Taxon } from "~/interface/shared";

interface DetailsSidebarSwitcherProps {
  handleMetadataUpdate: (key: string, value: string) => void;
  handleWorkflowRunSelect: (workflowRun: WorkflowRun) => void;
  handleTabChange: (tab: CurrentTabSample) => void;
  currentRun: WorkflowRun | PipelineRun;
  currentTab: CurrentTabSample;
  snapshotShareId?: string;
  closeSidebar: () => void;
  sidebarVisible: boolean;
  sidebarMode: "taxonDetails" | "sampleDetails";
  sample: Sample;
  background: Background | null;
  sidebarTaxonData: Taxon | null;
}

export const DetailsSidebarSwitcher = ({
  background,
  handleMetadataUpdate,
  handleWorkflowRunSelect,
  handleTabChange,
  currentRun,
  currentTab,
  snapshotShareId,
  closeSidebar,
  sidebarVisible,
  sidebarMode,
  sample,
  sidebarTaxonData,
}: DetailsSidebarSwitcherProps) => {
  const getTaxonSideBarParams = (
    sidebarTaxonData: Taxon,
  ): TaxonDetailsModeProps => {
    return {
      background: background,
      parentTaxonId: (sidebarTaxonData.genus || {}).taxId,
      taxonId: sidebarTaxonData.taxId,
      taxonName: sidebarTaxonData.name,
      taxonValues: {
        NT: { rpm: get("nt.rpm", sidebarTaxonData) || 0 },
        NR: { rpm: get("nr.rpm", sidebarTaxonData) || 0 },
      },
    };
  };

  const getSampleSideBarParams = (): SampleDetailsModeProps => {
    const sampleWorkflowLabels = compact([
      size(sample.pipeline_runs) && WORKFLOW_TABS.SHORT_READ_MNGS,
      find({ workflow: WorkflowType.CONSENSUS_GENOME }, sample.workflow_runs) &&
        WORKFLOW_TABS.CONSENSUS_GENOME,
      find({ workflow: WorkflowType.AMR }, sample.workflow_runs) &&
        WORKFLOW_TABS.AMR,
    ]);
    return {
      currentRun: currentRun,
      currentWorkflowTab: currentTab,
      handleWorkflowTabChange: handleTabChange,
      onWorkflowRunSelect: handleWorkflowRunSelect,
      sample,
      sampleId: sample.id,
      sampleWorkflowLabels,
      snapshotShareId: snapshotShareId,
      onMetadataUpdate: handleMetadataUpdate,
    };
  };
  if (!sample) return null;
  return (
    <DetailsSidebar
      visible={sidebarVisible}
      mode={sidebarMode}
      onClose={withAnalytics(
        closeSidebar,
        ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_DETAILS_SIDEBAR_CLOSED,
        {
          sampleId: sample.id,
          sampleName: sample.name,
        },
      )}
      params={
        sidebarMode === "taxonDetails" && sidebarTaxonData
          ? getTaxonSideBarParams(sidebarTaxonData)
          : getSampleSideBarParams()
      }
    />
  );
};
