import { get } from "./core";

export const getBasespaceProjects = (accessToken: $TSFixMe) =>
  get("/basespace/projects", {
    params: {
      access_token: accessToken,
    },
  });

export const getSamplesForBasespaceProject = (
  accessToken: $TSFixMe,
  basespaceProjectId: $TSFixMe,
) =>
  get("/basespace/samples_for_project", {
    params: {
      access_token: accessToken,
      basespace_project_id: basespaceProjectId,
    },
  });
