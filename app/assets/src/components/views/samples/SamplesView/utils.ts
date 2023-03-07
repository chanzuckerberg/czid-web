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
