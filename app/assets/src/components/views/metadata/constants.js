export const GROUP_ORDER = ["Sample", "Host", "Infection", "Sequencing"];

export const getGroupIndex = group =>
  GROUP_ORDER.includes(group) ? GROUP_ORDER.indexOf(group) : GROUP_ORDER.length;
