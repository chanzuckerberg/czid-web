import { RouteComponentProps } from "react-router-dom";
import { SortDirectionType } from "react-virtualized";
import { ThresholdConditions } from "~/components/utils/ThresholdMap";
import { WorkflowCount, WorkflowType } from "~/components/utils/workflows";
import { ObjectCollectionView } from "~/components/views/discovery/DiscoveryDataLayer";
import { FilterList, ObjectType } from "./samplesView";
import { Project } from "./shared";

export interface DiscoveryViewProps extends RouteComponentProps {
  admin?: boolean;
  domain: string;
  mapTilerKey?: string;
  projectId?: string;
  snapshotProjectDescription?: string;
  snapshotProjectName?: string;
  snapshotShareId?: string;
  updateDiscoveryProjectId?(...args: unknown[]): unknown;
}

export type DimensionsDetailed = Array<
  Dimension | LocationV2Dimension | TimeBinDimension
>;

export interface Dimension {
  dimension: string;
  values: DimensionValue[];
}

type LocationV2Dimension = {
  dimension: "locationV2";
  values: (DimensionValue & { parents: string[] })[];
};

type TimeBinDimension = {
  dimension: "time_bin";
  values: (DimensionValue & { start: string; end: string })[];
};

export interface DimensionValue {
  text: string;
  value: string;
  count: number;
}

export type SelectedFilters = {
  annotationsSelected?: Array<{ name: string }>;
  hostSelected?: Array<number>;
  locationV2Selected?: Array<string>;
  taxonSelected?: Array<{ id: number; name: string; level: string }>;
  taxonThresholdsSelected?: Array<ThresholdConditions>;
  timeSelected?: string;
  tissueSelected?: string[];
  visibilitySelected?: string;
};

export type WorkflowSets = {
  [K in WorkflowType]: Set<string>;
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
  /** @deprecated Use getFilteredSampleCount() during the migration. */
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
  projectDimensions: DimensionsDetailed;
  projectId: string;
  plqcPreviewedSamples?: string[];
  rawMapLocationData: Record<string, MapEntry>;
  sampleActiveColumnsByWorkflow: { [workflow: string]: string[] };
  sampleDimensions: DimensionsDetailed;
  sampleWasDeleted: string | null;
  search: string;
  selectableSampleIds: string[];
  selectedSampleIdsByWorkflow: WorkflowSets;
  showFilters: boolean;
  showStats: boolean;
  userDataCounts: {
    sampleCountByWorkflow: DiscoveryViewState["filteredSampleCountsByWorkflow"];
    sampleCount: number;
    projectCount: number;
    visualizationCount?: number;
  };
  workflow: WorkflowType;
  workflowEntity: string;
}

export interface ConfigForWorkflow {
  bannerTitle: string;
  objectCollection?: ObjectCollectionView<ObjectType, string>;
  noDataLinks: {
    external?: boolean;
    href: string;
    text: string;
  }[];
  noDataMessage: string;
  // For NextGen migration:
  getSelectableIds: () => string[] | undefined;
  getFilteredSampleCount: () => number | undefined;
  getRows: () => any[];
  fetchWorkflowRuns: (conditions: Conditions) => void;
  fetchPage: (range: {
    startIndex: number;
    stopIndex: number;
  }) => Promise<any[]>;
}

export interface Conditions {
  projectId: string;
  snapshotShareId: string;
  search: string;
  orderBy?: string;
  orderDir?: SortDirectionType;
  filters: FilterList & { workflow: WorkflowType };
  sampleIds?: string[];
}
