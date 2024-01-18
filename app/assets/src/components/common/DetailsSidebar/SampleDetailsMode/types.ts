import { PipelineRun, SummaryStats } from "~/interface/shared";

export interface AdditionalInfo {
  name: string;
  project_id: number;
  project_name: string;
  upload_date?: string;
  host_genome_name?: string;
  host_genome_taxa_category?: string;
  editable?: boolean;
  notes?: string | null;
  ercc_comparison: { name: string; actual: number; expected: number }[];
  summary_stats?: SummaryStats;
  pipeline_run?: PipelineRun;
}

export type SidebarTabName = "Metadata" | "Pipelines" | "Notes";
