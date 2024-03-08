import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import Project from "~/interface/project";
import { ReportMetadata } from "~/interface/reportMetaData";
import Sample from "~/interface/sample";
import {
  BlastData,
  ConsensusGenomeClick,
  CurrentTabSample,
  FilterSelections,
  Lineage,
  SampleReportViewMode,
} from "~/interface/sampleView";
import { Background, PipelineRun, Taxon } from "~/interface/shared";
import { DispatchSelectedOptionsType } from "../../utils";

export interface MngsReportProps {
  backgrounds: Background[] | undefined;
  currentTab: CurrentTabSample;
  clearAllFilters: () => void;
  dispatchSelectedOptions: React.Dispatch<DispatchSelectedOptionsType>;
  enableMassNormalizedBackgrounds: boolean;
  filteredReportData: Taxon[];
  handleAnnotationUpdate: () => void;
  handleBlastClick: (x: BlastData) => void;
  handleConsensusGenomeClick: (
    params: ConsensusGenomeClick,
    sample: Sample,
  ) => void;
  handleCoverageVizClick: (newCoverageVizParams: CoverageVizParamsRaw) => void;
  handlePreviousConsensusGenomeClick: (
    params: ConsensusGenomeClick,
    sample: Sample,
  ) => void;
  handleTaxonClick: (x: Taxon) => void;
  handleViewClick: (x: { view: SampleReportViewMode }) => void;
  lineageData: { [key: string]: Lineage };
  loadingReport: boolean;
  ownedBackgrounds: Background[];
  otherBackgrounds: Background[];
  pipelineRun: PipelineRun;
  project: Project | null;
  reportData: Taxon[];
  reportMetadata: ReportMetadata;
  sample: Sample | null;
  selectedOptions: FilterSelections;
  snapshotShareId?: string;
  view: SampleReportViewMode;
}
