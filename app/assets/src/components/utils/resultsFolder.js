export const RESULTS_FOLDER_STAGE_KEYS = {
  stageNameKey: "name",
  stageDescriptionKey: "stageDescription",
  stepsKey: "steps",
  dagJsonKey: "stageDagJson",
};

export const RESULTS_FOLDER_STEP_KEYS = {
  stepNameKey: "name",
  stepDescriptionKey: "stepDescription",
  filesKey: "fileList",
  readsAfterKey: "readsAfter",
};

// "runCdHitDup" and "cdhitdup_out" are required here for backwards compatibility
export const READ_DEDUP_KEYS = [
  "runCdHitDup",
  "cdhitdup_out",
  "runIdSeqDedup",
  "idseq_dedup_out",
];

export const RESULTS_FOLDER_ROOT_KEY = "displayedData";
