import { get, postWithCSRF, putWithCSRF } from "./core";

export const getPersistedBackgrounds = () => get("/persisted_backgrounds.json");

export const getPersistedBackground = (
  projectId: number,
): Promise<{ background_id: number }> =>
  get(`/persisted_backgrounds/${projectId}.json`);

interface BackgroundParams {
  projectId: number;
  backgroundId: number;
}

export const updatePersistedBackground = ({
  projectId,
  backgroundId,
}: BackgroundParams) =>
  putWithCSRF(`/persisted_backgrounds/${projectId}.json`, {
    backgroundId,
  });

export const createPersistedBackground = ({
  projectId,
  backgroundId,
}: BackgroundParams) =>
  postWithCSRF("/persisted_backgrounds.json", {
    projectId,
    backgroundId,
  });
