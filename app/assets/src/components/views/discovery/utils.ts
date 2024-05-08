import { map } from "lodash/fp";
import moment from "moment";
import { ThresholdForAPI } from "~/components/utils/ThresholdMap";
import { WORKFLOWS } from "~/components/utils/workflows";
import { NextGenFilters, SelectedFilters } from "~/interface/discoveryView";
import { FilterList } from "~/interface/samplesView";
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    orderKeys.push(getOrderByKeyFor(TAB_SAMPLES, WORKFLOWS[workflowKey].value));
    orderKeys.push(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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

export const prepareFilters = (
  filters: SelectedFilters | Record<string, never>,
) => {
  const preparedFilters = {} as FilterList;
  const filtersToFormat = [
    "timeSelected",
    "taxonSelected",
    "taxonThresholdSelected",
  ];

  // We remove the "Selected" suffix from non-formatted filter keys
  Object.keys(filters).forEach(key => {
    if (!filtersToFormat.includes(key)) {
      preparedFilters[key.replace("Selected", "")] = filters[key];
    }
  });

  // Time is formatted: we translate values into date ranges
  if (filters.timeSelected) {
    const startDate = {
      "1_week": [7, "days"],
      "1_month": [1, "months"],
      "3_month": [3, "months"],
      "6_month": [6, "months"],
      "1_year": [1, "years"],
    };

    preparedFilters.time = [
      moment()
        .subtract(...startDate[filters.timeSelected])
        .format("YYYYMMDD"),
      moment().add(1, "days").format("YYYYMMDD"),
    ];
  }

  // Taxon is formatted: this filter needs to store complete option, so need to convert to values only
  if (filters.taxonSelected && filters.taxonSelected.length) {
    preparedFilters.taxaLevels = map("level", filters.taxonSelected);
    preparedFilters.taxon = map("id", filters.taxonSelected);
  }

  // Taxon Threshold is formatted: for compatibility with the API query
  if (Array.isArray(filters.taxonThresholdsSelected)) {
    preparedFilters.taxonThresholds = filters.taxonThresholdsSelected.reduce(
      (result, threshold) => {
        const parsedMetric = threshold["metric"].split(":");

        // basic validation that the metric contains a valid count type and metric
        if (
          parsedMetric.length === 2 &&
          ["nt", "nr"].includes(parsedMetric[0])
        ) {
          const [countType, metric] = parsedMetric;
          const { operator, value } = threshold;
          result.push({
            metric,
            count_type: countType.toUpperCase(),
            operator,
            value,
          });
        }

        return result;
      },
      [] as Array<ThresholdForAPI>,
    );
  }

  return preparedFilters;
};

export const prepareNextGenFilters = (
  filters: SelectedFilters | Record<string, never>,
): NextGenFilters => {
  const preparedFilters: NextGenFilters = {
    taxonNames:
      filters.taxonSelected?.map(taxonObject => taxonObject.name) ?? [],
  };

  if (filters.timeSelected != null) {
    const date = new Date();
    switch (filters.timeSelected) {
      case "1_week":
        date.setDate(date.getDate() - 7);
        break;
      case "1_month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "3_month":
        date.setMonth(date.getMonth() - 3);
        break;
      case "6_month":
        date.setMonth(date.getMonth() - 6);
        break;
      case "1_year":
        date.setMonth(date.getMonth() - 12);
        break;
    }
    preparedFilters.startedAtIso = date.toISOString();
  }

  return preparedFilters;
};
