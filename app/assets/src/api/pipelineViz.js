import { get } from "./core";

export const getGraph = (sampleId, pipelineVersion) =>
  get(
    `/samples/${sampleId}/pipeline_viz${
      pipelineVersion ? `/${pipelineVersion}` : ""
    }.json`,
  );
