import { isEmpty, map, pick, toLower } from "lodash/fp";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { WORKFLOWS, WorkflowType } from "~/components/utils/workflows";
import { URL_FIELDS } from "~/components/views/SampleView/utils";
import { AnnotationFilterOption } from "~/interface/discovery";
import { ThresholdFilterShape } from "~/interface/sample";
import { LabelVal, SelectedOptions } from "~/interface/shared";

const urlParser = new UrlQueryParser(URL_FIELDS);

export interface TempSelectedOptionsShape {
  background: number;
  categories: {
    categories: string[];
    subcategories: Record<string, any> | Record<string, never>;
  };
  taxa: LabelVal[];
  readSpecificity: number;
  thresholdsShortReads?: ThresholdFilterShape[];
  thresholdsLongReads?: ThresholdFilterShape[];
}

interface generateUrlOptions {
  persistDefaultBg?: boolean;
  sampleId: string;
  snapshotShareId?: string | null;
  tempSelectedOptions?: TempSelectedOptionsShape | Record<string, never>;
  workflow?: WorkflowType | null;
  workflowRunId?: string | null;
}

const generateUrlToSampleView = ({
  sampleId,
  snapshotShareId = null,
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
  tempSelectedOptions = null,
  workflow = null,
  workflowRunId = null,
  persistDefaultBg = false,
}: generateUrlOptions): string => {
  const currentTab = workflow ? WORKFLOWS[workflow]?.label : null;
  const snapshotSharePrefix = snapshotShareId ? `/pub/${snapshotShareId}` : "";

  /* we don't want to persist the default background to the sample report
  we intentionally do not have a default there because it leads to misinterpretation
  if the user isn't intentional about which background they're using
  */
  const defaultBackgroundId = 26;
  if (
    tempSelectedOptions?.background === defaultBackgroundId &&
    !persistDefaultBg
  ) {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    tempSelectedOptions.background = null;
  }

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
  optionsToTemporarilyPersist?: string[];
  selectedOptions: SelectedOptions & {
    annotationsSelected?: $TSFixMe;
    taxonSelected?: $TSFixMe;
    taxonThresholdsSelected?: $TSFixMe;
  };
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

  const annotationsForSampleView = transformAnnotationsFormatForSampleView(
    tempSelectedOptions?.annotationsSelected,
  );

  const sampleViewFormattedSelectedOptions = {
    annotations: annotationsForSampleView,
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
      sampleViewFormattedSelectedOptions["thresholdsShortReads"] =
        transformHeatmapThresholdsFormatForSampleView(
          tempSelectedOptions?.thresholdFilters,
        );
      break;
    case DISCOVERY_VIEW_SOURCE_TEMP_PERSISTED_OPTIONS:
      sampleViewFormattedSelectedOptions["thresholdsShortReads"] =
        tempSelectedOptions?.taxonThresholdsSelected;
      break;
    default: {
      console.error(
        `Failed to temporarily persist thresholds to SampleView from source: ${source}.`,
      );
      sampleViewFormattedSelectedOptions["thresholdsShortReads"] = [];
    }
  }

  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
  return sampleViewFormattedSelectedOptions;
};

const transformAnnotationsFormatForSampleView = (
  annotationFilters: AnnotationFilterOption[],
) =>
  annotationFilters
    ? map(
        (annotationFilter: AnnotationFilterOption) => annotationFilter.name,
        annotationFilters,
      )
    : [];

// SampleView thresholds expect the metric format: nt:z_score
// SamplesHeatmapView thresholds are in the format: NT_zscore so we convert them appropriately
const transformHeatmapThresholdsFormatForSampleView = heatmapThresholdFilters =>
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
  }, heatmapThresholdFilters);

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
