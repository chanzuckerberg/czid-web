import { get, postWithCSRF, deleteWithCSRF, putWithCSRF } from "./core";

const createSnapshot = projectId =>
  postWithCSRF(`/pub/projects/${projectId}/create`);

const getSnapshotInfo = projectId =>
  get(`/pub/projects/${projectId}/info.json`);

const deleteSnapshot = snapshotShareId =>
  deleteWithCSRF(`/pub/${snapshotShareId}/destroy`);

const updateSnapshotBackground = (snapshotShareId, background_id) =>
  putWithCSRF(`/pub/${snapshotShareId}/update_background`, {
    background_id,
  });

export {
  createSnapshot,
  getSnapshotInfo,
  deleteSnapshot,
  updateSnapshotBackground,
};
