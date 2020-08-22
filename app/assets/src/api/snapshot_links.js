import { get, postWithCSRF, deleteWithCSRF } from "./core";

const createSnapshot = projectId =>
  postWithCSRF(`/pub/projects/${projectId}/create`);

const getSnapshotInfo = projectId =>
  get(`/pub/projects/${projectId}/info.json`);

const deleteSnapshot = snapshotShareId =>
  deleteWithCSRF(`/pub/${snapshotShareId}/destroy`);

export { createSnapshot, getSnapshotInfo, deleteSnapshot };
