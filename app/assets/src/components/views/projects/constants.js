export const MAX_DESCRIPTION_LENGTH = 700;
export const DEFAULT_ROW_HEIGHT = 68;
export const MAX_PROJECT_ROW_HEIGHT = 98;

export const PROJECT_TABLE_COLUMNS = {
  project: {
    tooltip: "User-defined project name, description, and author.",
  },
  created_at: {
    tooltip: "Date project was created in CZ ID.",
  },
  hosts: {
    tooltip:
      "User-selected organism(s) from which the samples in the project were collected.",
  },
  tissues: {
    tooltip:
      "User-supplied metadata field indicating sample types in the project.",
  },
  number_of_samples: {
    tooltip: "Total number of samples in the project.",
  },
};
