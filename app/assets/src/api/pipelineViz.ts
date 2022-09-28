import { get } from "./core";

export const getGraph = (sampleId: $TSFixMe, pipelineVersion: $TSFixMe) =>
  get(
    `/samples/${sampleId}/pipeline_viz${
      pipelineVersion ? `/${pipelineVersion}` : ""
    }.json`,
  );
