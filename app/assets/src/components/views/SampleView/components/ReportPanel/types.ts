import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  AmrDeprectatedData,
  BlastData,
  ConsensusGenomeClick,
  CurrentTabSample,
  FilterSelections,
  Lineage,
  SampleReportViewMode,
  WorkflowRunResults,
} from "~/interface/sampleView";
import { Background, NumberId, PipelineRun, Taxon } from "~/interface/shared";

export interface ReportPanelProps {
  amrDeprecatedData?: AmrDeprectatedData[];
  backgrounds?: Background[];
  currentRun: PipelineRun | WorkflowRun;
  currentTab: CurrentTabSample;
  clearAllFilters?: () => void;
  enableMassNormalizedBackgrounds?: boolean;
  filteredReportData?: Taxon[];
  handleAnnotationUpdate?: () => void;
  handleBlastClick?: (x: BlastData) => void;
  handleConsensusGenomeClick?: (x: ConsensusGenomeClick) => void;
  handleCoverageVizClick?: (newCoverageVizParams: CoverageVizParamsRaw) => void;
  handlePreviousConsensusGenomeClick?: (x: ConsensusGenomeClick) => void;
  handleOptionChanged?: (x: { key: string; value: string }) => void;
  handleTaxonClick?: (x: Taxon) => void;
  handleViewClick?: (x: { view: SampleReportViewMode }) => void;
  handleWorkflowRunSelect?: (workflowRun: WorkflowRun) => void;
  refreshDataFromOptionsChange?: (x: {
    key: string;
    newSelectedOptions: FilterSelections;
  }) => void;
  lineageData?: { [key: string]: Lineage };
  loadingReport?: boolean;
  loadingWorkflowRunResults?: boolean;
  ownedBackgrounds?: Background[];
  otherBackgrounds?: Background[];
  project?: NumberId;
  reportData?: Taxon[];
  reportMetadata?: ReportMetadata;
  sample: Sample;
  selectedOptions?: FilterSelections;
  snapshotShareId?: string;
  view?: SampleReportViewMode;
  workflowRunResults?: Record<string, never> | WorkflowRunResults;
}
