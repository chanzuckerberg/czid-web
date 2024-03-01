import { get } from "lodash/fp";
import memoize from "memoize-one";
import {
  getBackgrounds,
  samplesUploadedByCurrentUser,
  userIsCollaboratorOnAllSamples,
  workflowRunsCreatedByCurrentUser,
} from "~/api";
import {
  validateSampleIds,
  validateWorkflowRunIds,
} from "~/api/access_control";
import { WORKFLOW_ENTITIES } from "~/components/utils/workflows";
import { Background } from "~/interface/shared";
import { BackgroundOptionType, SelectedDownloadType } from "./types";

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

export async function checkAllObjectsUploadedByCurrentUser({
  entityIds,
  workflowEntity,
}: {
  entityIds?: Set<number>;
  workflowEntity?: string;
}): Promise<boolean> {
  if (!entityIds) {
    return false;
  }
  return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
    ? workflowRunsCreatedByCurrentUser(Array.from(entityIds))
    : samplesUploadedByCurrentUser(Array.from(entityIds));
}

export async function checkUserIsCollaboratorOnAllSamples({
  entityIds,
  workflowEntity,
}: {
  entityIds?: Set<number>;
  workflowEntity?: string;
}): Promise<boolean> {
  if (!entityIds) {
    return false;
  }
  return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
    ? false
    : userIsCollaboratorOnAllSamples(Array.from(entityIds));
}

export async function fetchValidationInfo({
  entityIds,
  workflow,
  workflowEntity,
}) {
  if (!entityIds) return null;

  return workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS
    ? validateWorkflowRunIds({
        workflowRunIds: entityIds,
        workflow,
      })
    : validateSampleIds({
        sampleIds: entityIds,
        workflow,
      });
}
