import { find, getOr, isEmpty, omit, size } from "lodash/fp";
import { diff } from "~/components/utils/objectUtil";
import {
  getWorkflowTypeFromLabel,
  isMngsWorkflow,
  WorkflowCount,
  WORKFLOWS,
  WorkflowType,
  WORKFLOW_ENTITIES,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import Sample from "~/interface/sample";
import { CurrentTabSample, FilterSelections } from "~/interface/sampleView";
import { TREE_METRICS } from "./constants";

export const getWorkflowCount = (sample: Sample): WorkflowCount => {
  const count = {};
  Object.keys(WORKFLOWS).forEach((workflow: WorkflowType) => {
    switch (WORKFLOWS[workflow].entity) {
      case WORKFLOW_ENTITIES.SAMPLES:
        /* This line works to separate Illumina/Nanopore because all pipeline runs for a
        sample will be of one technology type (Illumina or Nanopore).
        Equivalently, to deprecate initial_workflow we could update samples_controller#show
        to return technology and filter the pipeline runs by technology. */
        count[workflow] =
          sample.initial_workflow === workflow && size(sample.pipeline_runs);
        break;
      case WORKFLOW_ENTITIES.WORKFLOW_RUNS:
        count[workflow] = size(
          sample.workflow_runs?.filter(run => run?.workflow === workflow),
        );
        break;
    }
  });
  return count;
};

export const getDefaultSelectedOptions = (): FilterSelections => {
  return {
    annotations: [],
    flags: [],
    background: null,
    categories: { categories: [], subcategories: { Viruses: [] } },
    // Don't set the default metric as 'aggregatescore' because it computed based on the background model and will error if the background model is 'None'.
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    metricShortReads: find(
      { value: "nt_r" },
      TREE_METRICS[WorkflowType.SHORT_READ_MNGS],
    ).value,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    metricLongReads: find(
      { value: "nt_b" },
      TREE_METRICS[WorkflowType.LONG_READ_MNGS],
    ).value,
    nameType: "Scientific name",
    readSpecificity: 0,
    taxa: [],
    thresholdsShortReads: [],
    thresholdsLongReads: [],
  };
};

export const determineInitialTab = ({
  initialWorkflow,
  workflowCount,
  currentTab,
}: {
  initialWorkflow: WorkflowType;
  workflowCount: WorkflowCount;
  currentTab: CurrentTabSample | null;
}) => {
  const {
    [WorkflowType.SHORT_READ_MNGS]: shortReadMngs,
    [WorkflowType.LONG_READ_MNGS]: longReadMngs,
    [WorkflowType.CONSENSUS_GENOME]: cg,
    [WorkflowType.AMR]: amr,
    [WorkflowType.BENCHMARK]: benchmark,
  } = workflowCount;
  if (currentTab && workflowCount[getWorkflowTypeFromLabel(currentTab)] > 0) {
    return currentTab;
  } else if (shortReadMngs) {
    return WORKFLOW_TABS.SHORT_READ_MNGS;
  } else if (longReadMngs) {
    return WORKFLOW_TABS.LONG_READ_MNGS;
  } else if (cg) {
    return WORKFLOW_TABS.CONSENSUS_GENOME;
  } else if (amr) {
    return WORKFLOW_TABS.AMR;
  } else if (benchmark) {
    return WORKFLOW_TABS.BENCHMARK;
  } else if (initialWorkflow) {
    return WORKFLOWS[initialWorkflow]?.label;
  } else {
    return WORKFLOW_TABS.SHORT_READ_MNGS;
  }
};

export const getAppliedFilters = (
  selectedOptions,
): Omit<
  FilterSelections,
  "nameType" | "metricShortReads" | "metricLongReads" | "background"
> => {
  // Only Taxon, Category, Subcategories, Read Specifity, and Threshold Filters are considered "Applied Filters"
  return omit(
    ["nameType", "metricShortReads", "metricLongReads", "background"],
    diff(selectedOptions, getDefaultSelectedOptions()),
  ) as Omit<
    FilterSelections,
    "nameType" | "metricShortReads" | "metricLongReads" | "background"
  >;
};

export const hasAppliedFilters = (currentTab, selectedOptions) => {
  const {
    categories,
    readSpecificity,
    taxa,
    thresholdsShortReads,
    thresholdsLongReads,
  } = selectedOptions;

  const hasCategoryFilters =
    !isEmpty(getOr([], "categories", categories)) ||
    !isEmpty(getOr([], "subcategories.Viruses", categories));
  const hasReadSpecificityFilters = readSpecificity !== 0;
  const hasTaxonFilter = !isEmpty(taxa);
  const thresholds =
    currentTab === WORKFLOW_TABS.SHORT_READ_MNGS
      ? thresholdsShortReads
      : thresholdsLongReads;
  const hasThresholdFilters = !isEmpty(thresholds);

  return (
    hasCategoryFilters ||
    hasReadSpecificityFilters ||
    hasTaxonFilter ||
    hasThresholdFilters
  );
};

export const hasMngsRuns = (sample: Sample) => {
  const workflowCount = getWorkflowCount(sample);
  // remove keys of workflowCount that are falsy
  // and count how many of the remaining keys are mngs workflows
  const mngsWorkflowsCount = Object.entries(workflowCount).filter(
    ([workflow, count]: [WorkflowType, number]) =>
      isMngsWorkflow(workflow) && count > 0,
  ).length;
  return mngsWorkflowsCount > 0;
};

export const loadState = (
  store: Storage,
  key: string,
): {
  selectedOptions?: { background: number | null; metric: string };
  [x: string]: unknown;
} => {
  try {
    const state = store.getItem(key);
    if (!state) {
      return {};
    }
    return JSON.parse(state) || {};
  } catch (e) {
    // Avoid possible bad transient state related crash
    // eslint-disable-next-line no-console
    console.warn(`Bad state: ${e}`);
  }
  return {};
};
