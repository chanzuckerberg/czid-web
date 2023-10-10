import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import { ReportMetadata } from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  AmrDeprectatedData,
  BlastData,
  ConsensusGenomeClick,
  ConsensusGenomeWorkflowRunResults,
  CurrentTabSample,
  FilterSelections,
  Lineage,
  SampleReportViewMode,
} from "~/interface/sampleView";
import { Background, NumberId, PipelineRun, Taxon } from "~/interface/shared";

export interface ReportPanelProps {
  amrDeprecatedData: AmrDeprectatedData[] | null;
  backgrounds?: Background[];
  currentRun?: PipelineRun | WorkflowRun | null;
  currentTab: CurrentTabSample;
  clearAllFilters: () => void;
  enableMassNormalizedBackgrounds: boolean;
  filteredReportData: Taxon[];
  handleAnnotationUpdate: () => void;
  handleBlastClick: (x: BlastData) => void;
  handleConsensusGenomeClick: (x: ConsensusGenomeClick, sample: Sample) => void;
  handleCoverageVizClick: (newCoverageVizParams: CoverageVizParamsRaw) => void;
  handlePreviousConsensusGenomeClick: (
    x: ConsensusGenomeClick,
    sample: Sample,
  ) => void;
  handleOptionChanged: (x: { key: string; value: string }) => void;
  handleTaxonClick: (x: Taxon) => void;
  handleViewClick: (x: { view: SampleReportViewMode }) => void;
  handleWorkflowRunSelect: (workflowRun: WorkflowRun) => void;
  refreshDataFromOptionsChange: (x: {
    key: string;
    newSelectedOptions: FilterSelections;
  }) => void;
  lineageData: { [key: string]: Lineage };
  loadingReport: boolean;
  ownedBackgrounds: Background[];
  otherBackgrounds: Background[];
  project: NumberId | null;
  reportData: Taxon[];
  reportMetadata: ReportMetadata;
  sample: Sample | null;
  selectedOptions: FilterSelections;
  snapshotShareId?: string;
  view: SampleReportViewMode;
  workflowRunResults?:
    | Record<string, never>
    | ConsensusGenomeWorkflowRunResults;
}
