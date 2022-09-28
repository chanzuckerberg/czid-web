import { get, putWithCSRF, postWithCSRF } from "./core";

export const getPersistedBackgrounds = () => get("/persisted_backgrounds.json");

export const getPersistedBackground = (projectId: $TSFixMe) =>
  get(`/persisted_backgrounds/${projectId}.json`);

export const updatePersistedBackground = ({
  projectId,
  backgroundId,
}: $TSFixMe) =>
  putWithCSRF(`/persisted_backgrounds/${projectId}.json`, {
    backgroundId,
  });

export const createPersistedBackground = ({
  projectId,
  backgroundId,
}: $TSFixMe) =>
  postWithCSRF("/persisted_backgrounds.json", {
    projectId,
    backgroundId,
  });
