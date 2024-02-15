import { SortDirectionType } from "react-virtualized";
import { ThresholdForAPI } from "~/components/utils/ThresholdMap";
import { WorkflowType } from "~/components/utils/workflows";
import { ObjectCollectionView } from "~/components/views/discovery/DiscoveryDataLayer";
import { AnnotationValue } from "~/interface/discovery";
import { LocationObject } from "~/interface/shared";
import { DateString } from "~/interface/shared/generic";

export type ObjectType = PipelineTypeRun | BaseWorkflowRun | CGRun;

export interface SamplesViewProps {
  activeColumns?: string[];
  admin?: boolean;
  currentDisplay: string;
  currentTab: string;
  domain?: string;
  filters?: FilterList;
  filtersSidebarOpen?: boolean;
  hasAtLeastOneFilterApplied?: boolean;
  handleNewWorkflowRunsCreated?(param: {
    numWorkflowRunsCreated: number;
    workflow: WorkflowType;
  }): void;
  hideAllTriggers?: boolean;
  mapLevel?: string;
  mapLocationData?: Record<string, unknown>;
  mapPreviewedLocationId?: number;
  mapTilerKey?: string;
  numOfMngsSamples?: number;
  objects?: ObjectCollectionView<ObjectType>;
  onActiveColumnsChange?(activeColumns: string[]): void;
  onClearFilters?(): void;
  onDeleteSample(): void;
  onDisplaySwitch?: (display: string) => void;
  onLoadRows(param: { startIndex: number; stopIndex: number }): Promise<any>;
  onMapClick?(): void;
  onMapLevelChange?(mapLevel: string): void;
  onMapMarkerClick?(locationId: number): void;
  onMapTooltipTitleClick?(locationId: number): void;
  onPLQCHistogramBarClick?(sampleIds: string[]): void;
  onObjectSelected?(param: {
    object: Entry;
    currentEvent: React.MouseEvent<HTMLDivElement, MouseEvent>;
  }): void;
  onUpdateSelectedIds(selectedSampleIds: Set<number>): void;
  onSortColumn?(param: {
    sortBy: string;
    sortDirection: SortDirectionType;
  }): void;
  projectId?: number;
  protectedColumns?: string[];
  sampleStatsSidebarOpen?: boolean;
  selectableIds?: number[];
  selectedIds?: Set<number>;
  showAllMetadata?: boolean;
  sortBy?: string;
  sortDirection?: SortDirectionType;
  snapshotShareId?: string;
  sortable?: boolean;
  userDataCounts?: { sampleCountByWorkflow: { [key: string]: number } };
  workflow?: WorkflowType;
  workflowEntity?: string;
}

export interface Conditions {
  filters?: FilterList;
  orderBy?: string;
  orderDir?: SortDirectionType;
  projectId?: number;
  search?: string;
  snapshotShareId?: string;
  workflow?: WorkflowType;
}

export interface ViewProps {
  conditions?: Conditions;
  pageSize?: number;
  onViewChange: () => void;
  displayName: string;
}

export interface FilterList {
  annotations: Array<{ name: AnnotationValue }>;
  host: Array<number>;
  locationV2: Array<string>;
  taxon: Array<number>;
  taxonThresholds: Array<ThresholdForAPI>;
  taxaLevels: Array<string>;
  time: [string, string];
  tissue: Array<string>;
  visibility: string;
}

export interface Entry {
  collection_date: DateString;
  collection_location_v2: LocationObject;
  createdAt: DateString;
  duplicateCompressionRatio: number;
  erccReads: number;
  host: string;
  host_sex: string;
  id: number;
  medakaModel: string;
  notes: string;
  nucleotide_type: string;
  privateUntil: DateString;
  projectId: number;
  qcPercent: number;
  referenceAccession: object;
  sample: {
    name: string;
    project: string;
    userId: number;
    pipelineRunFinalized: number;
    pipelineRunStatus: string;
  };
  sample_type: string;
  status: string;
  technology: string;
  totalReads: number;
  totalRuntime: number;
  water_control: string;
  wetlabProtocol: string;
  workflow: string;
}

export interface BaseRun {
  collection_date: DateString;
  collection_location_v2: LocationObject;
  createdAt: DateString;
  erccReads: number;
  host: string;
  id: number;
  notes: string;
  nucleotide_type: string;
  privateUntil: DateString;
  projectId: number;
  sample: {
    name: string;
    project: string;
    userId: number;
    pipelineRunFinalized: number;
    pipelineRunStatus: string;
    userNameWhoInitiatedWorkflowRun?: string;
    userIdWhoInitiatedWorkflowRun?: number;
  };
  sample_type: string;
  water_control: string;
}

export interface BaseWorkflowRun extends BaseRun {
  workflow: string;
  status: string;
}

export interface CGRun extends BaseWorkflowRun {
  wetlabProtocol: string;
  technology: string;
  referenceAccession: object;
  medakaModel: string;
}

export interface PipelineTypeRun extends BaseRun {
  duplicateCompressionRatio: number;
  erccReads: number;
  meanInsertSize: number;
  nonHostReads: number;
  pipelineVersion: string;
  qcPercent: number;
  totalReads: number;
  totalRuntime: number;
  subsampleFraction: number;
}

export interface SamplesViewHandle {
  reset(): void;
}
