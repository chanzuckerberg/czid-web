import deepEqual from "fast-deep-equal";
import {
  filter,
  find,
  get,
  groupBy,
  isEmpty,
  mapValues,
  omit,
} from "lodash/fp";
import {
  isPipelineFeatureAvailable,
  MASS_NORMALIZED_FEATURE,
} from "~/components/utils/pipeline_versions";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { WORKFLOWS } from "~/components/utils/workflows";
import {
  KEY_DISCOVERY_VIEW_OPTIONS,
  SAMPLE_WAS_DELETED,
} from "~/components/views/discovery/constants";
import Sample from "~/interface/sample";
import { CurrentTabSample, FilterSelections } from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";
import {
  KEY_SAMPLE_VIEW_OPTIONS,
  LOCAL_STORAGE_FIELDS,
  NOTIFICATION_TYPES,
  TABS,
  TREE_METRICS,
  URL_FIELDS,
} from "./constants";
import { filterReportData } from "./filters";
import { showNotification } from "./notifications";
import { getDefaultSelectedOptions, loadState } from "./setup";
export * from "./constants";
export * from "./filters";
export * from "./notifications";
export * from "./setup";

export const addSampleDeleteFlagToSessionStorage = (sampleName: string) => {
  const shortenedSampleName =
    sampleName.length > 37 ? `${sampleName.slice(0, 37)}...` : sampleName;

  const discoverySessionState = JSON.parse(
    sessionStorage.getItem(KEY_DISCOVERY_VIEW_OPTIONS),
  );
  sessionStorage.setItem(
    KEY_DISCOVERY_VIEW_OPTIONS,
    JSON.stringify({
      ...discoverySessionState,
      [SAMPLE_WAS_DELETED]: shortenedSampleName,
    }),
  );
};

export const getConsensusGenomeData = (sample: Sample) => {
  // Mapping of taxids to WorkflowRuns
  return groupBy(
    "inputs.taxon_id",
    filter(
      { workflow: WORKFLOWS.CONSENSUS_GENOME.value },
      get("workflow_runs", sample),
    ),
  );
};
// @ts-expect-error working with Lodash types
export const mapValuesWithKey = mapValues.convert({ cap: false });

export const getPiplineRunByVersionOrId = (pipelineVersion, sample) => {
  return find(
    pipelineVersion
      ? { pipeline_version: pipelineVersion }
      : { id: sample.default_pipeline_run_id },
    sample.pipeline_runs,
  );
};

export const shouldEnableMassNormalizedBackgrounds = pipelineRun => {
  return (
    pipelineRun &&
    pipelineRun.total_ercc_reads > 0 &&
    isPipelineFeatureAvailable(
      MASS_NORMALIZED_FEATURE,
      pipelineRun.pipeline_version,
    )
  );
};
export const urlParser = new UrlQueryParser(URL_FIELDS);

export const initializeSelectedOptions = ({
  tempSelectedOptions,
  currentTab,
  selectedOptionsFromLocal,
  selectedOptionsFromUrl,
}): FilterSelections => {
  return {
    ...getDefaultSelectedOptions(),
    // for long read mNGS samples, do not allow taxon filters in tempSelectedOptions to persist from DiscoveryView
    ...(!isEmpty(tempSelectedOptions) && currentTab !== TABS.LONG_READ_MNGS
      ? tempSelectedOptions
      : {
          ...selectedOptionsFromLocal,
          ...selectedOptionsFromUrl,
        }),
  };
};

type ACTIONTYPE =
  | { type: "newBackground"; payload: { background: number } }
  | {
      type: "revertToSampleViewFilters";
      payload: {
        selectedOptionsFromLocal: {
          background: number | null;
          metric: string;
        };
      };
    }
  | {
      type: "rawReportDataProcessed";
      payload: { allTaxIds: number[]; backgroundIdUsed: number };
    }
  | {
      type: "optionChanged";
      payload: {
        key: string;
        value: any;
      };
    }
  | {
      type: "filterReportData";
      payload: {
        currentTab: CurrentTabSample;
        reportData: Taxon[];
        setFilteredReportData: (x: Taxon[]) => void;
      };
    }
  | { type: "clear"; payload: FilterSelections };

export const selectedOptionsReducer = (
  state: FilterSelections,
  action: ACTIONTYPE,
): FilterSelections => {
  switch (action.type) {
    case "newBackground": {
      return {
        ...state,
        background: action.payload.background,
      };
    }
    case "revertToSampleViewFilters": {
      return {
        ...getDefaultSelectedOptions(),
        ...action.payload.selectedOptionsFromLocal,
      };
    }
    case "rawReportDataProcessed": {
      return {
        ...state,
        ...(!isEmpty(action.payload.allTaxIds) &&
          !isEmpty(state.taxa) && {
            taxa: filter(
              taxon => action.payload.allTaxIds.includes(taxon.id),
              state.taxa,
            ),
          }),
        ...(state.background !== action.payload.backgroundIdUsed && {
          background: action.payload.backgroundIdUsed,
        }),
      };
    }
    case "optionChanged": {
      if (deepEqual(state[action.payload.key], action.payload.value)) {
        break;
      }
      const newState = {
        ...state,
        [action.payload.key]: action.payload.value,
      };
      saveToLocalStorage(newState);
      return newState;
    }
    case "filterReportData": {
      if (action.payload.setFilteredReportData) {
        action.payload.setFilteredReportData(
          filterReportData({
            currentTab: action?.payload?.currentTab,
            reportData: action?.payload?.reportData,
            filters: {
              annotations: state.annotations,
              flags: state.flags,
              taxa: state.taxa,
              categories: state.categories,
              thresholdsShortReads: state.thresholdsShortReads,
              thresholdsLongReads: state.thresholdsLongReads,
              readSpecificity: state.readSpecificity,
            },
          }),
        );
      }
      return {
        ...state,
      };
    }
    case "clear": {
      return action.payload;
    }
  }
};

const saveToLocalStorage = (chosenSelectedOptions: FilterSelections) => {
  const localStorageFieldsMap: LOCAL_STORAGE_FIELDS = {
    selectedOptions: {
      ...omit(["background", "taxon"], chosenSelectedOptions),
    },
  };
  localStorage.setItem(
    KEY_SAMPLE_VIEW_OPTIONS,
    JSON.stringify(localStorageFieldsMap),
  );
};

export const getStateFromUrlandLocalStorage = (
  location: Location,
  localStorage: Storage,
) => {
  const {
    selectedOptions: selectedOptionsFromUrl,
    tempSelectedOptions,
    workflowRunId: workflowRunIdFromUrl,
    currentTab: currentTabFromUrl,
    view: viewFromUrl,
    pipelineVersion: pipelineVersionFromUrl,
    ...nonNestedUrlState
  } = urlParser.parse(location.search);

  const {
    selectedOptions: rawSelectedOptionsFromLocal,
    ...nonNestedLocalState
  } = loadState(localStorage, KEY_SAMPLE_VIEW_OPTIONS);

  const selectedOptionsFromLocal = overwriteAggregatescoreMetric(
    rawSelectedOptionsFromLocal,
  );

  // Note from Suzette - August 2023
  // This error is added to help us identify when we are not handling state in the URL or localStorage and should be removed once we have handled all state
  if (!isEmpty(nonNestedLocalState) || !isEmpty(nonNestedUrlState)) {
    console.error({
      "Unhandled State in localStorage": nonNestedLocalState,
      "Unhandled State in URL": nonNestedUrlState,
    });
    throw new Error(
      "Unhandled State in URL or localStorage - please handle the information or confirm that it is unneeded and remove from URL or localstorage",
    );
  }

  return {
    viewFromUrl,
    pipelineVersionFromUrl,
    selectedOptionsFromLocal,
    selectedOptionsFromUrl,
    tempSelectedOptions,
    workflowRunIdFromUrl,
    currentTabFromUrl,
  };
};

export const provideOptionToRevertToSampleViewFilters = (
  tempSelectedOptions,
  currentTabFromUrl,
  notificationCallback,
) => {
  const { annotations, taxa, thresholdsShortReads } = tempSelectedOptions || {};

  const persistedDiscoveryFiltersPresent = [
    annotations,
    taxa,
    thresholdsShortReads,
  ].some(filter => !isEmpty(filter));

  if (
    persistedDiscoveryFiltersPresent &&
    currentTabFromUrl !== TABS.LONG_READ_MNGS
  ) {
    showNotification(NOTIFICATION_TYPES.discoveryViewFiltersPersisted, {
      revertToSampleViewFilters: notificationCallback,
    });
  }
};

const overwriteAggregatescoreMetric = selectedOptionsFromLocal => {
  if (
    !get("background", selectedOptionsFromLocal) &&
    get("metricShortReads", selectedOptionsFromLocal) === "aggregatescore"
  ) {
    // If the user does not have a background and has metric 'aggregatescore', overwrite the selected option
    // 'metric' from 'aggregatescore' to 'NT r (total reads)' because the aggregatescore
    // is computed once the user selects a background.
    selectedOptionsFromLocal["metricShortReads"] = find(
      { value: "nt_r" },
      TREE_METRICS[TABS.SHORT_READ_MNGS],
    ).value;
  }
  return selectedOptionsFromLocal;
};
