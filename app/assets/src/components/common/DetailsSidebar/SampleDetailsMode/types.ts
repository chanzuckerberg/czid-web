import { PipelineRun, SummaryStats } from "~/interface/shared";

export interface AdditionalInfo {
  name: string;
  project_id: number;
  project_name: string;
  upload_date?: string | null;
  host_genome_name?: string | null | undefined;
  host_genome_taxa_category?: string | null | undefined;
  editable?: boolean | null | undefined;
  notes?: string | null;
  ercc_comparison?: { name: string; actual: number; expected: number }[] | null;
  summary_stats?: SummaryStats | null;
  pipeline_run?: PipelineRun | null;
}

export type SidebarTabName = "Metadata" | "Pipelines" | "Notes";
