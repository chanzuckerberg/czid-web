import { find, isEmpty, map, toLower, pick, values } from "lodash/fp";

import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { WORKFLOWS } from "~/components/utils/workflows";
import { URL_FIELDS } from "~/components/views/SampleView/constants";
import { WorkflowValues, ThresholdFilterShape } from "~/interface/sample";
import { LabelVal } from "~/interface/shared";

const urlParser = new UrlQueryParser(URL_FIELDS);

export interface TempSelectedOptionsShape {
  background: number;
  categories: {
    categories: string[],
    subcategories: Record<string,any> | Record<string,never>,
  };
  taxa: LabelVal[];
  readSpecificity: number;
  thresholds?: ThresholdFilterShape[];
}

interface generateUrlOptions {
  sampleId: number;
  snapshotShareId?: number | null;
  tempSelectedOptions?: TempSelectedOptionsShape | Record<string,never>;
  workflow?: WorkflowValues | null;
  workflowRunId?: number | null;
}

const generateUrlToSampleView = ({
  sampleId,
  snapshotShareId = null,
  tempSelectedOptions = null,
  workflow = null,
  workflowRunId = null,
} : generateUrlOptions): string => {
  const currentTab = workflow
    ? find({ value: workflow }, values(WORKFLOWS)).label
    : null;
  const snapshotSharePrefix = snapshotShareId ? `/pub/${snapshotShareId}` : "";
  const queryString = `${urlParser.stringify({
    ...(tempSelectedOptions && { tempSelectedOptions }),
    currentTab,
    workflowRunId,
  })}`;

  return `${snapshotSharePrefix}/samples/${sampleId}${
    queryString === "" ? "" : `?${queryString}`
  }`;
};

const HEATMAP_SOURCE_TEMP_PERSISTED_OPTIONS = "heatmap";
const DISCOVERY_VIEW_SOURCE_TEMP_PERSISTED_OPTIONS = "discovery";

interface getTempSelectedParams {
  optionsToTemporarilyPersist: string[];
  selectedOptions: Record<string, any[]>;
  source: "discovery" | "heatmap" | "";
}

const getTempSelectedOptions = ({
  // If optionsToTemporarilyPersist is omitted, then all selectedOptions will be temporarily persisted.
  // Otherwise only temporarily persist the specified selected options.
  optionsToTemporarilyPersist = [],
  selectedOptions,
  source = "",
}: getTempSelectedParams): TempSelectedOptionsShape => {
  const tempSelectedOptions = isEmpty(optionsToTemporarilyPersist)
    ? selectedOptions
    : pick(optionsToTemporarilyPersist, selectedOptions);

  const sampleViewFormattedSelectedOptions = {
    background: tempSelectedOptions?.background,
    categories: {
      categories: tempSelectedOptions?.categories || [],
      subcategories: tempSelectedOptions?.subcategories || {},
    },
    taxa: tempSelectedOptions?.taxonSelected || [],
    readSpecificity: tempSelectedOptions?.readSpecificity,
  };

  // Transform thresholds from different sources to match the format that the SampleView expects
  // TODO: Standardize option names and formats across sources (ie. heatmap, discovery view, sample view) and deprecate the transformation logic below
  switch (source) {
    case HEATMAP_SOURCE_TEMP_PERSISTED_OPTIONS:
      // eslint-disable-next-line standard/computed-property-even-spacing
      sampleViewFormattedSelectedOptions[
        "thresholds"
      ] = transformHeatmapThresholdsFormatForSampleView(
        tempSelectedOptions?.thresholdFilters,
      );
      break;
    case DISCOVERY_VIEW_SOURCE_TEMP_PERSISTED_OPTIONS:
      sampleViewFormattedSelectedOptions["thresholds"] =
        tempSelectedOptions?.taxonThresholdsSelected;
      break;
    default: {
      console.error(
        `Failed to temporarily persist thresholds to SampleView from source: ${source}.`,
      );
      sampleViewFormattedSelectedOptions["thresholds"] = [];
    }
  }

  return sampleViewFormattedSelectedOptions;
};

// SampleView thresholds expect the metric format: nt:z_score
// SamplesHeatmapView thresholds are in the format: NT_zscore so we convert them appropriately
const transformHeatmapThresholdsFormatForSampleView = heatmapThresoldFilters =>
  map(threshold => {
    // i.e. nt:r => count
    const mappedSampleViewThresholdValue = mapThresholdMetricName(
      // Get everything after `nt:` (3 characters)
      threshold.metric.slice(3),
    );
    return {
      ...threshold,
      // Convert to lowercase and replace everything after the first _ with the mappedSampleViewThresholdValue
      // i.e. NT_r => nt:count
      metric: toLower(threshold.metric).replace(
        /_.*/,
        `:${mappedSampleViewThresholdValue}`,
      ),
    };
  }, heatmapThresoldFilters);

const mapThresholdMetricName = metricName => {
  switch (metricName) {
    case "zscore":
      return "z_score";
    case "rpm":
      return "rpm";
    case "r":
      return "count";
    case "percentidentity":
      return "percent_identity";
    case "alignmentlength":
      return "alignment_length";
    case "logevalue":
      return "e_value";
  }
};

export {
  generateUrlToSampleView,
  getTempSelectedOptions,
  HEATMAP_SOURCE_TEMP_PERSISTED_OPTIONS,
  DISCOVERY_VIEW_SOURCE_TEMP_PERSISTED_OPTIONS,
};
