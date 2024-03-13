import { WorkflowType } from "~/components/utils/workflows";
import { ThresholdFilterData } from "~/interface/dropdown";

export type DropdownOptionType = {
  text: string;
  value: string;
};

export type MetricsOptionType = DropdownOptionType;

export type BackgroundOptionType = {
  text: string;
  value: string | number;
  mass_normalized: boolean;
};

export type SelectedFieldValueType =
  | string
  | number
  | boolean
  | ThresholdFilterData[]
  | undefined;

export type SelectedFieldType = Record<string, SelectedFieldValueType>;

export type SelectedFieldsType = Record<string, SelectedFieldType>;

export type SelectedDownloadType = {
  downloadType: string | null;
  fields: Record<
    string,
    {
      value: string;
      displayName: string;
    }
  >;
  validObjectIds: string[];
  workflow: WorkflowType;
  workflowEntity?: string;
};

export enum WorkflowRunStatusType {
  SUCCEEDED = "SUCCEEDED",
  SUCCEEDED_WITH_ISSUE = "SUCCEEDED_WITH_ISSUE",
  IN_PROGRESS = "SUCCEEDED",
  FAILED = "FAILED",
}

export type RunValidationType = {
  id: string;
  status: WorkflowRunStatusType;
  ownerUserId: number;
};
