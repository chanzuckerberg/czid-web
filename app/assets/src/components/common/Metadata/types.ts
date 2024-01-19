import { Dictionary } from "lodash";
import {
  CSV,
  HostGenome,
  LocationObject,
  MetadataType,
  MetadataTypes,
  MetadataValue,
  NameId,
  SampleFromApi,
  SampleType,
} from "~/interface/shared";

export interface Issues {
  errors: string[];
  warnings: string[];
}

export interface MetadataCSVLocationsMenuProps {
  metadata: MetadataUploadProps["metadata"];
  locationMetadataType: {
    dataType: string;
    key: string;
    name: string;
  };
  onMetadataChange: ({ metadata }: { metadata: any }) => void;
  hostGenomes: HostGenome[];
}

export type MetadataCSVUploadProps = Pick<
  MetadataUploadProps,
  | "samples"
  | "project"
  | "className"
  | "onMetadataChange"
  | "samplesAreNew"
  | "onDirty"
  | "visible"
>;

export interface MetadataCSVUploadState {
  metadata: CSV;
  validatingCSV: boolean;
  lastSampleNamesValidated: string[];
  lastProjectIdValidated: number;
}

export interface MetadataInputProps {
  className: string;
  value: MetadataValue | null | undefined;
  metadataType: Pick<
    MetadataType,
    "dataType" | "key" | "options" | "isBoolean"
  >;
  // Third optional parameter signals to the parent whether to immediately save. false means "wait for onSave to fire".
  // This is useful for the text input, where the parent wants to save onBlur, not onChange.
  onChange: (key: string, value: MetadataValue, shouldSave?: boolean) => void;
  onSave?: (key: string) => Promise<void>;
  isHuman?: boolean;
  sampleTypes?: SampleTypeProps[];
  warning?: string;
  withinModal?: boolean;
  taxaCategory: string;
}

export interface MetadataManualInputProps
  extends Pick<
    MetadataUploadProps,
    | "samples"
    | "project"
    | "className"
    | "onMetadataChange"
    | "samplesAreNew"
    | "withinModal"
  > {
  projectMetadataFields?: MetadataTypes;
  hostGenomes?: HostGenome[];
  sampleTypes: SampleType[];
}

export interface MetadataManualInputState {
  selectedFieldNames: MetadataType[];
  projectMetadataFields: MetadataTypes;
  headers: { [key: string]: string };
  metadataFieldsToEdit: { [key: string]: unknown };
  headersToEdit: string[];
  hostGenomesByName: Dictionary<HostGenome>;
  // Which cell the "Apply to All" button should appear on.
  applyToAllCell: {
    sampleName: string;
    column: string;
  };
}

export interface MetadataPreLocationSearch {
  headers: string[];
  rows: {
    [key: string]: string;
  }[];
}

export interface MetadataTable {
  headers: string[];
  rows: Row[];
}

export interface MetadataUploadProps {
  issues?: Issues;
  metadata?: MetadataTable;
  onMetadataChange: ({
    metadata,
    issues,
    wasManual,
    newHostGenomes,
    validatingCSV,
  }: {
    metadata?: MetadataTable | null;
    issues?: Issues;
    wasManual?: boolean;
    newHostGenomes?: any[];
    validatingCSV?: boolean;
  }) => void;
  onShowCSVInstructions: $TSFixMeFunction;
  project?: NameId;
  className?: string;
  samples?: SampleFromApi[];
  visible?: boolean;
  // Immediately called when the user changes anything, even before validation has returned.
  // Can be used to disable the header navigation.
  onDirty?: $TSFixMeFunction;
  workflows?: Set<string>;
  samplesAreNew?: boolean;
  withinModal?: boolean;
}

export interface MetadataUploadState {
  currentTab: string;
  issues: Issues;
  projectMetadataFields: MetadataTypes | Record<never, never>;
  allProjectMetadataFields?: MetadataType[];
  hostGenomes: HostGenome[];
  sampleTypes: SampleType[];
  validatingCSV: boolean;
  fetchingCSVLocationMatches: boolean;
  showMetadataCSVLocationsMenu: boolean;
}

export interface Row {
  [key: string]: string | LocationObject;
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2411
  "Host Genome"?: string;
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2411
  "Host Organism"?: string;
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2411
  "Sample Name"?: string;
}

interface SampleTypeProps {
  name: string;
  group: string;
  insect_only: boolean;
  human_only: boolean;
}
