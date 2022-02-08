import { get } from "./core";

export const getBasespaceProjects = accessToken =>
  get("/basespace/projects", {
    params: {
      access_token: accessToken,
    },
  });

export const getSamplesForBasespaceProject = (
  accessToken,
  basespaceProjectId,
) =>
  get("/basespace/samples_for_project", {
    params: {
      access_token: accessToken,
      basespace_project_id: basespaceProjectId,
    },
  });
