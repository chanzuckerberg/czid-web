import { get } from "lodash/fp";
import memoize from "memoize-one";
import { fetchQuery } from "relay-runtime";
import { getBackgrounds, userIsCollaboratorOnAllSamples } from "~/api";
import {
  validateSampleIds,
  validateWorkflowRunIds,
} from "~/api/access_control";
import { WORKFLOW_ENTITIES } from "~/components/utils/workflows";
import { Entry } from "~/interface/samplesView";
import { Background } from "~/interface/shared";
import {
  BackgroundOptionType,
  RunValidationType,
  SelectedDownloadType,
  WorkflowRunStatusType,
} from "./types";
import { BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery as BulkDownloadModalValidConsensusGenomeWorkflowRunsQueryType } from "./__generated__/BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery.graphql";

export const triggersCondtionalFieldMetricList = (
  conditionalField,
  selectedFields,
) => {
  const thresholdMetrics = selectedFields["filter_by"].map(obj =>
    obj["metric"].replace("_", "."),
  ); // Heatmap metrics use underscore as separator, bulk downloads use periods
  return (
    thresholdMetrics.filter(metric =>
      conditionalField.triggerValues.includes(metric),
    ).length > 0
  );
};

export const triggersConditionalField = (conditionalField, selectedFields) =>
  conditionalField.dependentFields
    .map(dependentField =>
      selectedFields &&
      selectedFields["filter_by"] &&
      dependentField === "filter_by"
        ? triggersCondtionalFieldMetricList(conditionalField, selectedFields)
        : conditionalField.triggerValues.includes(
            get(dependentField, selectedFields),
          ),
    )
    .some(Boolean);

export const assembleSelectedDownload = memoize(
  (
    selectedDownloadTypeName,
    allSelectedFields,
    allSelectedFieldsDisplay,
    objectIds,
    workflow,
    workflowEntity,
  ): SelectedDownloadType => {
    const fieldValues = allSelectedFields?.[selectedDownloadTypeName];
    const fieldDisplayNames =
      allSelectedFieldsDisplay?.[selectedDownloadTypeName];

    const fields = {};
    if (fieldValues) {
      for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
        fields[fieldName] = {
          value: fieldValue,
          // Use the display name for the value if it exists. Otherwise, use the value.
          displayName: fieldDisplayNames[fieldName] || fieldValue,
        };
      }
    }

    return {
      downloadType: selectedDownloadTypeName,
      fields,
      validObjectIds: Array.from(objectIds),
      workflow,
      workflowEntity,
    };
  },
);

export const DEFAULT_CREATION_ERROR =
  "An unknown error occurred. Please contact us for help.";

export async function fetchBackgrounds(): Promise<BackgroundOptionType[]> {
  const { backgrounds } = await getBackgrounds();
  if (!backgrounds) {
    return [];
  }

  return backgrounds.map((background: Background) => ({
    text: background.name,
    value: background.id,
    mass_normalized: background.mass_normalized,
  }));
}

export async function checkUserIsCollaboratorOnAllSamples({
  entityIds,
  workflowEntity,
}: {
  entityIds?: Set<string>;
  workflowEntity?: string;
}): Promise<boolean> {
  if (!entityIds) {
    return false;
  }
  return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
    ? false
    : userIsCollaboratorOnAllSamples(Array.from(entityIds));
}

export async function fetchRailsValidationInfo({
  entityIds,
  workflow,
  workflowEntity,
}) {
  if (!entityIds) return null;
  const entityIdsArray = Array.from(entityIds);

  return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
    ? validateWorkflowRunIds({
        workflowRunIds: entityIdsArray,
        workflow,
      })
    : validateSampleIds({
        sampleIds: entityIdsArray,
        workflow,
      });
}

export async function fetchValidationInfo({
  environment,
  BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery,
  entityIds,
  authenticityToken,
}) {
  return fetchQuery<BulkDownloadModalValidConsensusGenomeWorkflowRunsQueryType>(
    environment,
    BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery,
    {
      workflowRunIds: entityIds
        ? Array.from(entityIds).map((id: number) => id.toString())
        : [],
      authenticityToken,
    },
  ).toPromise();
}

export const getRailsSampleIdsFromWorkflowRuns = (
  selectedObjects: Entry[],
  validObjectIds: Set<string>,
): string[] => {
  return selectedObjects
    .filter(obj => validObjectIds.has(obj?.id))
    .map(obj => obj?.sample?.id);
};

export const getRailsSampleIdsFromSamples = (
  _selectedObjects: Entry[],
  validObjectIds: Set<string>,
): string[] => {
  return Array.from(validObjectIds || []);
};

export const parseRailsValidationInfo = (validationInfo: {
  validIds: number[];
  invalidSampleNames: string[];
  error: string | null;
}) => {
  const validIds = validationInfo.validIds.map(id => id.toString());
  const { invalidSampleNames, error: validationError } = validationInfo;

  return { validIds, invalidSampleNames, validationError };
};

export const parseValidationInfo = (
  validationInfo: {
    fedWorkflowRuns?: RunValidationType[];
    error?: string;
  },
  selectedObjects: Entry[],
) => {
  const { fedWorkflowRuns: workflowRuns, error: validationError } =
    validationInfo;

  const validIds =
    workflowRuns
      ?.filter(run => run.status === WorkflowRunStatusType.SUCCEEDED)
      .map(run => run.id) ?? [];

  const invalidSampleNames =
    workflowRuns
      ?.filter(run => run.status !== WorkflowRunStatusType.SUCCEEDED)
      .map(
        run =>
          selectedObjects.find(obj => obj.id.toString() === run.id)?.sample
            .name ?? "",
      ) ?? [];

  return {
    validIds,
    invalidSampleNames,
    validationError: validationError ?? null,
  };
};

// this argument is here because both of the parsers need to have the same arguments
export const parseRailsIsUserOwnerOfAllObjects = (
  _,
  __,
  isUserOwnerOfAllObjects: boolean | null,
) => isUserOwnerOfAllObjects ?? false;

export const parseIsUserOwnerOfAllObjects = (
  validationInfo: {
    fedWorkflowRuns?: RunValidationType[];
    error?: string;
  },
  currentUserId?: number | null,
) => {
  const { fedWorkflowRuns: workflowRuns } = validationInfo;
  if (!currentUserId || !workflowRuns) {
    return false;
  }

  return workflowRuns.every(run => run.ownerUserId === currentUserId);
};
