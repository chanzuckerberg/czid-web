import {
  WORKFLOWS,
  WORKFLOW_KEY_FOR_VALUE,
} from "~/components/utils/workflows";
import { ObjectsType } from "~/interface/samplesView";

export const getSelectedObjects = ({
  selectedIds,
  objects,
}: {
  selectedIds: Set<number>;
  objects: ObjectsType;
}) => {
  if (!selectedIds || !objects) return [];

  const selectedObjects = objects.loaded.filter(object =>
    selectedIds.has(object.id),
  );

  return selectedObjects;
};

export const getShorthandFromWorkflow = workflow => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey]?.shorthand;
};
