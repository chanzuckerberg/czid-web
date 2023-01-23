import { SortDirectionType } from "react-virtualized";
import { ThresholdConditions } from "~/components/utils/ThresholdMap";
import { WORKFLOW_VALUES, WorkflowCount } from "~/components/utils/workflows";
import { AnnotationValue } from "./discovery";
import { Project } from "./shared";

export interface DiscoveryViewProps {
  admin?: boolean;
  domain: string;
  history?: object;
  mapTilerKey?: string;
  projectId?: number;
  snapshotProjectDescription?: string;
  snapshotProjectName?: string;
  snapshotShareId?: string;
  updateDiscoveryProjectId?(...args: unknown[]): unknown;
}

export interface Dimension {
  dimension: string;
  values: string[];
}
export interface FiltersPreFormatting {
  annotations: Array<{ name: AnnotationValue }>;
  host: Array<number>;
  locationV2: Array<string>;
  taxon: Array<{ id: number; name: string; level: string }>;
  taxonThresholds: Array<ThresholdConditions>;
  time: string;
  tissue: string[];
  visibility: string;
}

export type SelectedFilters = {
  annotationsSelected: Array<{ name: AnnotationValue }>;
  hostSelected: Array<number>;
  locationV2Selected: Array<string>;
  taxonSelected: Array<{ id: number; name: string; level: string }>;
  taxonThresholdsSelected: Array<ThresholdConditions>;
  timeSelected: string;
  tissueSelected: string[];
  visibilitySelected: string;
};

export type WorkflowSets = {
  [K in WORKFLOW_VALUES]: Set<number>;
};

export type MapEntry = {
  geo_level: string;
  id: number;
  hasOwnEntries: boolean;
  name: string;
};

export interface DiscoveryViewState {
  currentDisplay: string;
  currentTab: string;
  emptyStateModalOpen: boolean;
  filteredProjectCount: number;
  filteredProjectDimensions: Dimension[];
  filteredSampleCountsByWorkflow: WorkflowCount;
  filteredSampleDimensions: Dimension[];
  filteredSampleStats: { count?: number };
  filteredVisualizationCount: number;
  filters: SelectedFilters | Record<string, never>;
  loadingDimensions: boolean;
  loadingLocations: boolean;
  loadingStats: boolean;
  mapLevel: string;
  mapLocationData: Record<string, { name: string }>;
  mapPreviewedLocationId: number;
  mapSidebarProjectCount: number;
  mapSidebarProjectDimensions: Dimension[];
  mapSidebarSampleCount: number;
  mapSidebarSampleDimensions: Dimension[];
  mapSidebarSampleStats: Record<string, $TSFixMeUnknown>;
  mapSidebarTab: string;
  orderBy: string;
  orderDirection: SortDirectionType;
  project: Project;
  projectDimensions: Dimension[];
  projectId: number;
  plqcPreviewedSamples?: string[];
  rawMapLocationData: Record<string, MapEntry>;
  sampleActiveColumnsByWorkflow: { [workflow: string]: string[] };
  sampleDimensions: Dimension[];
  search: string;
  selectableSampleIds: number[];
  selectableWorkflowRunIds: number[];
  selectedSampleIdsByWorkflow: WorkflowSets;
  showFilters: boolean;
  showStats: boolean;
  userDataCounts: {
    sampleCountByWorkflow: DiscoveryViewState["filteredSampleCountsByWorkflow"];
    sampleCount: number;
    projectCount: number;
    visualizationCount: number;
  };
  workflow: WORKFLOW_VALUES;
  workflowEntity: string;
}

export interface ConfigForWorkflow {
  [key: string]: {
    bannerTitle: string;
    objectCollection: Record<string, $TSFixMe>;
    noDataLinks: {
      external?: boolean;
      href: string;
      text: string;
    }[];
    noDataMessage: string;
  };
}
