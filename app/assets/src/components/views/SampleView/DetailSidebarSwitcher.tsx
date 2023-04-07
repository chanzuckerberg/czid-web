import { compact, find, get, size } from "lodash/fp";
import React from "react";
import { withAnalytics } from "~/api/analytics";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { SampleDetailsModeProps } from "~/components/common/DetailsSidebar/SampleDetailsMode";
import { TaxonDetailsModeProps } from "~/components/common/DetailsSidebar/TaxonDetailsMode";
import { WORKFLOWS } from "~/components/utils/workflows";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample, FilterSelections } from "~/interface/sampleView";
import { Background, PipelineRun, Taxon } from "~/interface/shared";

interface DetailsSidebarSwitcherProps {
  handleMetadataUpdate: (key: string, value: string) => void;
  handleWorkflowRunSelect: (workflowRun: WorkflowRun) => void;
  handleTabChange: (tab: CurrentTabSample) => void;
  getCurrentRun: () => WorkflowRun | PipelineRun;
  currentTab: CurrentTabSample;
  snapshotShareId: string;
  closeSidebar: () => void;
  sidebarVisible: boolean;
  sidebarMode: "taxonDetails" | "sampleDetails";
  sample: Sample;
  backgrounds: Background[];
  selectedOptions: FilterSelections;
  sidebarTaxonData: Taxon;
}

const DetailsSidebarSwitcher = ({
  handleMetadataUpdate,
  handleWorkflowRunSelect,
  handleTabChange,
  getCurrentRun,
  currentTab,
  snapshotShareId,
  closeSidebar,
  sidebarVisible,
  sidebarMode,
  sample,
  backgrounds,
  selectedOptions,
  sidebarTaxonData,
}: DetailsSidebarSwitcherProps) => {
  const getTaxonSideBarParams = (): TaxonDetailsModeProps => {
    return {
      background: find({ id: selectedOptions.background }, backgrounds),
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
      size(sample.pipeline_runs) && WORKFLOWS.SHORT_READ_MNGS.label,
      find(
        { workflow: WORKFLOWS.CONSENSUS_GENOME.value },
        sample.workflow_runs,
      ) && WORKFLOWS.CONSENSUS_GENOME.label,
      find({ workflow: WORKFLOWS.AMR.value }, sample.workflow_runs) &&
        WORKFLOWS.AMR.label,
    ]);

    return {
      currentRun: getCurrentRun(),
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
  // The following is not DRY but it does set up type narrowing.
  // ex. if the sidebarMode is "taxonDetails", typescript expects that DetailsSidebar
  // will be rendered with taxonSideBarParams rather that the possibilty of either
  // taxonSideBarParams OR sampleSideBarParams which do not overlap at all.
  if (sidebarMode === "taxonDetails") {
    return (
      <DetailsSidebar
        visible={sidebarVisible}
        mode={sidebarMode}
        onClose={withAnalytics(
          closeSidebar,
          "SampleView_details-sidebar_closed",
          {
            sampleId: sample.id,
            sampleName: sample.name,
          },
        )}
        params={getTaxonSideBarParams()}
      />
    );
  } else if (sidebarMode === "sampleDetails") {
    return (
      <DetailsSidebar
        visible={sidebarVisible}
        mode={sidebarMode}
        onClose={withAnalytics(
          closeSidebar,
          "SampleView_details-sidebar_closed",
          {
            sampleId: sample.id,
            sampleName: sample.name,
          },
        )}
        params={getSampleSideBarParams()}
      />
    );
  }
};

export default DetailsSidebarSwitcher;
