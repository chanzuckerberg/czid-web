import { get, putWithCSRF, postWithCSRF } from "./core";

export const getPersistedBackgrounds = () => get("/persisted_backgrounds.json");

export const getPersistedBackground = projectId =>
  get(`/persisted_backgrounds/${projectId}.json`);

export const updatePersistedBackground = ({ projectId, backgroundId }) =>
  putWithCSRF(`/persisted_backgrounds/${projectId}.json`, {
    backgroundId,
  });

export const createPersistedBackground = ({ projectId, backgroundId }) =>
  postWithCSRF("/persisted_backgrounds.json", {
    projectId,
    backgroundId,
  });
