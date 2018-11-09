export const pipelineHasAssembly = pipelineRun => {
  const versionNums = pipelineRun.pipeline_version.split(".");
  return +versionNums[0] >= 3 && +versionNums[1] >= 1;
};
