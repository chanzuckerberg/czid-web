import { OnBLASTClickProps } from "~/interface/shared";

export interface CoverageVizBottomSidebarProps {
  visible?: boolean;
  onBlastClick?: (x: OnBLASTClickProps) => void;
  onClose: () => void;
  params: {
    taxonId: number;
    taxonName: string;
    taxonCommonName: string;
    taxonLevel: string;
    taxonStatsByCountType: {
      ntContigs: number;
      ntReads: number;
      nrContigs: number;
      nrReads: number;
    };
    accessionData: {
      best_accessions: AccessionsSummary[];
      num_accessions: number;
    };
    // Link to the old alignment viz.
    alignmentVizUrl: string;
  };
  sampleId: number;
  pipelineVersion: string;
  nameType: string;
  snapshotShareId: string;
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

export interface HistogramTooltipData {
  data: [string, string | number][];
  name: string;
  disabled?: boolean;
}

export interface TooltipLocation {
  left: number;
  top: number;
}

export interface CoverageVizBottomSidebarsState {
  currentAccessionSummary: AccessionsSummary | null;
  histogramTooltipLocation?: TooltipLocation;
  histogramTooltipData: HistogramTooltipData[] | null;
  currentAccessionData?: AccessionsData;
}
