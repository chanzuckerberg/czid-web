import { WORKFLOWS } from "~/components/utils/workflows";
import { TAB_PROJECTS, TAB_SAMPLES, TAB_VISUALIZATIONS } from "./constants";

///
// sessionStorage keys for sorting
///

export const getOrderKeyPrefix = (tab, workflow) => {
  // for samples, each workflow has its own order parameters
  return tab === TAB_SAMPLES ? `${tab}-${workflow}` : tab;
};

export const getOrderByKeyFor = (tab, workflow = null) => {
  return `${getOrderKeyPrefix(tab, workflow)}OrderBy`;
};

export const getOrderDirKeyFor = (tab, workflow = null) => {
  return `${getOrderKeyPrefix(tab, workflow)}OrderDir`;
};

const getOrderKeysForSamplesTab = () => {
  const orderKeys = [];
  const workflowKeys = Object.keys(WORKFLOWS);
  workflowKeys.forEach(workflowKey => {
    orderKeys.push(getOrderByKeyFor(TAB_SAMPLES, WORKFLOWS[workflowKey].value));
    orderKeys.push(
      getOrderDirKeyFor(TAB_SAMPLES, WORKFLOWS[workflowKey].value),
    );
  });
  return orderKeys;
};

export const getSessionOrderFieldsKeys = () => {
  return [
    getOrderByKeyFor(TAB_PROJECTS),
    getOrderDirKeyFor(TAB_PROJECTS),
    ...getOrderKeysForSamplesTab(),
    getOrderByKeyFor(TAB_VISUALIZATIONS),
    getOrderDirKeyFor(TAB_VISUALIZATIONS),
  ];
};
