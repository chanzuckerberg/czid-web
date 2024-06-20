import { WorkflowType } from "~/components/utils/workflows";
import { BlastData } from "~/interface/sampleView";
import {
  AccessionData,
  SampleId,
  Taxon,
  TaxonLevelType,
  TooltipLocation,
} from "~/interface/shared";

export interface CoverageVizBottomSidebarProps {
  visible?: boolean;
  onBlastClick?: (x: BlastData) => void;
  onClose: () => void;
  params: CoverageVizParams | Record<string, never>;
  sampleId: SampleId;
  pipelineVersion: string;
  wdlVersion: string | null | undefined;
  nameType: string;
  snapshotShareId?: string;
  workflow: WorkflowType;
}

export interface CoverageVizParamsRaw {
  taxId: number;
  taxName: string;
  taxCommonName: string;
  taxLevel: TaxonLevelType;
  taxSpecies: Taxon[];
  taxonStatsByCountType: {
    ntContigs: number;
    ntReads: number;
    nrContigs: number;
    nrReads: number;
  };
}

export interface CoverageVizParams
  extends Omit<
    CoverageVizParamsRaw,
    "taxId" | "taxName" | "taxCommonName" | "taxLevel" | "taxSpecies"
  > {
  taxonId: CoverageVizParamsRaw["taxId"];
  taxonName: CoverageVizParamsRaw["taxName"];
  taxonCommonName: CoverageVizParamsRaw["taxCommonName"];
  taxonLevel: CoverageVizParamsRaw["taxLevel"];
  accessionData: AccessionData;
}
export interface AccessionsSummary {
  id: string;
  num_contigs: number;
  num_reads: number;
  name: string;
  score: number;
  coverage_depth: number;
  coverage_breadth: number;
  taxon_name: string;
  taxon_common_name: string;
}

export type Hit = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  [number, number],
];

export interface AccessionsData
  extends Pick<
    AccessionsSummary,
    "id" | "name" | "coverage_depth" | "coverage_breadth"
  > {
  coverage: [number, number, number, number, number][];
  hit_groups: Hit[];
  max_aligned_length: number;
  coverage_bin_size: number;
  avg_prop_mismatch: number;
  total_length: number;
}

export interface TooltipData {
  data: [string, string | number][];
  name: string;
  disabled?: boolean;
}

export interface CoverageVizBottomSidebarsState {
  currentAccessionSummary: AccessionsSummary | null;
  histogramTooltipLocation?: TooltipLocation;
  histogramTooltipData: TooltipData[] | null;
  currentAccessionData?: AccessionsData;
}
