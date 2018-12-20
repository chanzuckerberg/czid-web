import { last } from "lodash/fp";

export const pipelineVersionHasAssembly = pipelineVersion => {
  if (!pipelineVersion) return false;
  const versionNums = pipelineVersion.split(".");
  return +versionNums[0] >= 3 && +versionNums[1] >= 1;
};

// Get the basename from a file path
export const baseName = str => {
  let base = cleanLocalFilePath(str);

  let separator = "/";
  if (base.includes("\\")) {
    // If the name includes the backslash \ it's probably from Windows.
    separator = "\\";
  }

  // Get the last piece
  base = last(base.split(separator));

  if (base.includes(".")) {
    // Leave off the extension
    base = base.substring(0, base.lastIndexOf("."));
  }
  return base;
};

export const cleanLocalFilePath = name => {
  name = name.trim();

  // Remove ./ and .\ from the start of file paths
  return name.replace(/^\.[\\|/]/, "");
};
