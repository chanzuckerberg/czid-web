export const pipelineHasAssembly = pipelineRun => {
  if (!pipelineRun.pipeline_version) return false;
  const versionNums = pipelineRun.pipeline_version.split(".");
  return +versionNums[0] >= 3 && +versionNums[1] >= 1;
};

export const cleanLocalFileName = name => {
  name = name.trim();

  // Remove ./ and .\ from the start of file paths
  return name.replace(/^\.[\\|/]/, "");
};
