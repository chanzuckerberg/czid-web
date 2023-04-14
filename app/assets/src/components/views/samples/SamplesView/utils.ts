import { countBy, identity } from "lodash/fp";
import { Entry, ObjectsType } from "~/interface/samplesView";
import { WORKFLOW_ENTITIES } from "~utils/workflows";
import { PipelineRunStatuses, UPLOAD_FAILED } from "./constants";

export const getSelectedObjects = ({
  selectedIds,
  objects,
}: {
  selectedIds: Set<number>;
  objects: ObjectsType;
}) => {
  if (!selectedIds || !objects) return [];

  return objects.loaded.filter(object => selectedIds.has(object.id));
};

export const getStatusCounts = (objects: Entry[], workflowEntity: string) => {
  const statuses = objects.map(object => {
    let status: string;
    if (workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS) {
      status = object?.status;
    } else {
      status = object?.sample?.pipelineRunStatus;
    }
    if (status === "") {
      status = UPLOAD_FAILED;
    } else if (status !== PipelineRunStatuses.Complete) {
      status = PipelineRunStatuses.Failed;
    }
    return status;
  });

  return countBy(identity, statuses);
};
