import { GraphQLTaggedNode } from "relay-runtime";
import RelayModernEnvironment from "relay-runtime/lib/store/RelayModernEnvironment";
import {
  samplesUploadedByCurrentUser,
  workflowRunsCreatedByCurrentUser,
} from "~/api";
import { WorkflowConfigType, WorkflowType } from "~/components/utils/workflows";
import { Entry } from "~/interface/samplesView";
import { RunValidationType } from "./types";
import {
  fetchRailsValidationInfo,
  fetchValidationInfo,
  getRailsSampleIdsFromSamples,
  getRailsSampleIdsFromWorkflowRuns,
  parseIsUserOwnerOfAllObjects,
  parseRailsIsUserOwnerOfAllObjects,
  parseRailsValidationInfo,
  parseValidationInfo,
} from "./utils";

export type FetchValidationInfoFunctionInputType = {
  // Used for both fetch functions
  entityIds?: Set<string>;
  // Used for the NextGen fetch function
  environment?: RelayModernEnvironment;
  BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery?: GraphQLTaggedNode;
  authenticityToken?: string;
  // Used for the Legacy fetch function
  workflow?: WorkflowType;
  workflowEntity?: string;
};

type BulkDownloadModalConfigType = {
  fetchAreAllObjectsUploadedByCurrentUser: (
    entityIds: string[],
  ) => Promise<boolean | null>;
  fetchValidationInfoFunction: ({
    entityIds,
    environment,
    BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery,
    authenticityToken,
    workflow,
    workflowEntity,
  }: FetchValidationInfoFunctionInputType) => Promise<any>;
  getRailsSampleIds: (
    selectedObjects: Entry[],
    validIds: Set<string>,
  ) => string[];
  isUserOwnerParser: (
    // The NextGen parser uses validationInfo and currentUserId
    validationInfo: {
      fedWorkflowRuns: RunValidationType[];
      error: string;
    },
    currentUserId?: number | null,
    // The Legacy parser isn't needed, but this is here so that each have a parser function
    isUserOwnerOfAllObjects?: boolean | null,
  ) => boolean;
  validationParser: (
    validationInfo: // The NextGen shape is this one
    | {
          fedWorkflowRuns?: RunValidationType[];
          error?: string;
        }
      // The Legacy shape is this one
      | {
          validIds: number[];
          invalidSampleNames: string[];
          error: string | null;
        },
    selectedObjects?: Entry[],
  ) => {
    validIds: string[];
    invalidSampleNames: string[];
    validationError: string | null;
  };
};

const fetchAndParseValidationFromRails = {
  fetchValidationInfoFunction: fetchRailsValidationInfo,
  isUserOwnerParser: parseRailsIsUserOwnerOfAllObjects,
  validationParser: parseRailsValidationInfo,
};

export const BulkDownloadModalConfig: WorkflowConfigType<BulkDownloadModalConfigType> =
  {
    [WorkflowType.AMR]: {
      fetchAreAllObjectsUploadedByCurrentUser: workflowRunsCreatedByCurrentUser,
      getRailsSampleIds: getRailsSampleIdsFromWorkflowRuns,
      ...fetchAndParseValidationFromRails,
    },
    [WorkflowType.CONSENSUS_GENOME]: {
      fetchAreAllObjectsUploadedByCurrentUser: () => Promise.resolve(null),
      fetchValidationInfoFunction: fetchValidationInfo,
      isUserOwnerParser: parseIsUserOwnerOfAllObjects,
      validationParser: parseValidationInfo,
      getRailsSampleIds: getRailsSampleIdsFromWorkflowRuns,
    },
    [WorkflowType.SHORT_READ_MNGS]: {
      fetchAreAllObjectsUploadedByCurrentUser: samplesUploadedByCurrentUser,
      getRailsSampleIds: getRailsSampleIdsFromSamples,
      ...fetchAndParseValidationFromRails,
    },
    [WorkflowType.LONG_READ_MNGS]: {
      fetchAreAllObjectsUploadedByCurrentUser: samplesUploadedByCurrentUser,
      getRailsSampleIds: getRailsSampleIdsFromSamples,
      ...fetchAndParseValidationFromRails,
    },
    [WorkflowType.AMR_DEPRECATED]: {
      fetchAreAllObjectsUploadedByCurrentUser: () => Promise.resolve(null),
      getRailsSampleIds: () => [],
      ...fetchAndParseValidationFromRails,
    },
    [WorkflowType.BENCHMARK]: {
      fetchAreAllObjectsUploadedByCurrentUser: workflowRunsCreatedByCurrentUser,
      getRailsSampleIds: () => [],
      ...fetchAndParseValidationFromRails,
    },
  };
