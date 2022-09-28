import { get, postWithCSRF, deleteWithCSRF, putWithCSRF } from "./core";

const createSnapshot = (projectId: $TSFixMe) =>
  postWithCSRF(`/pub/projects/${projectId}/create`);

const getSnapshotInfo = (projectId: $TSFixMe) =>
  get(`/pub/projects/${projectId}/info.json`);

const deleteSnapshot = (snapshotShareId: $TSFixMe) =>
  deleteWithCSRF(`/pub/${snapshotShareId}/destroy`);

const updateSnapshotBackground = (
  snapshotShareId: $TSFixMe,
  backgroundId: $TSFixMe,
) =>
  putWithCSRF(`/pub/${snapshotShareId}/update_background`, {
    background_id: backgroundId,
  });

export {
  createSnapshot,
  getSnapshotInfo,
  deleteSnapshot,
  updateSnapshotBackground,
};
