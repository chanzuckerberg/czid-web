import { Notification } from "@czi-sds/components";
import { cx } from "@emotion/css";
import axios from "axios";
import DeepEqual from "fast-deep-equal";
import {
  assign,
  compact,
  difference,
  find,
  flatten,
  forEach,
  get,
  intersection,
  isEmpty,
  isEqual,
  keys,
  map,
  omit,
  property,
  pullAll,
  set,
  size,
  uniq,
} from "lodash/fp";
import queryString from "query-string";
import React, { useContext } from "react";
import { getSampleTaxons, getTaxaDetails, saveVisualization } from "~/api";
import { validateSampleIds } from "~/api/access_control";
import {
  ANALYTICS_EVENT_NAMES,
  TrackEventType,
  useTrackEvent,
  useWithAnalytics,
  WithAnalyticsType,
} from "~/api/analytics";
import { getSampleMetadataFields } from "~/api/metadata";
import { showBulkDownloadNotification } from "~/components/common/BulkDownloadNotification";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import ErrorBoundary from "~/components/common/ErrorBoundary";
import { SampleMessage } from "~/components/common/SampleMessage";
import { useAllowedFeatures } from "~/components/common/UserContext";
import FilterPanel from "~/components/layout/FilterPanel";
import ArrayUtils from "~/components/utils/ArrayUtils";
import { createCSVObjectURL, sanitizeCSVRow } from "~/components/utils/csv";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import { logError } from "~/components/utils/logUtil";
import { diff } from "~/components/utils/objectUtil";
import {
  isPipelineFeatureAvailable,
  MASS_NORMALIZED_FEATURE,
} from "~/components/utils/pipeline_versions";
import { showToast } from "~/components/utils/toast";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import {
  getTempSelectedOptions,
  HEATMAP_SOURCE_TEMP_PERSISTED_OPTIONS,
} from "~/components/utils/urls";
import { WorkflowType } from "~/components/utils/workflows";
import SamplesHeatmapVis from "~/components/views/SamplesHeatmapView/components/SamplesHeatmapVis";
import { URL_FIELDS } from "~/components/views/SampleView/utils";
import {
  ActionType,
  createAction,
  GlobalContext,
} from "~/globalContext/reducer";
import { copyShortUrlToClipboard } from "~/helpers/url";
import { ThresholdFilterData } from "~/interface/dropdown";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import { IconAlert } from "~ui/icons";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import { processMetadata } from "~utils/metadata";
import { SamplesHeatmapDownloadModal } from "./components/SamplesHeatmapDownloadModal/SamplesHeatmapDownloadModal";
import SamplesHeatmapFilters from "./components/SamplesHeatmapFilters";
import { OptionsType } from "./components/SamplesHeatmapFilters/SamplesHeatmapFilters";
import { SamplesHeatmapHeader } from "./components/SamplesHeatmapHeader";
import {
  APPLIED_FILTERS,
  BackgroundMetricType,
  BACKGROUND_METRICS,
  HEATMAP_FILTERS,
  METRIC_OPTIONS,
  NONE_BACKGROUND,
  NOTIFICATION_TYPES,
  SCALE_OPTIONS,
  SORT_SAMPLES_OPTIONS,
  SORT_TAXA_OPTIONS,
  SPECIFICITY_OPTIONS,
  TAXONS_PER_SAMPLE_RANGE,
  TAXON_LEVEL_OPTIONS,
  TAXON_LEVEL_SELECTED,
} from "./constants";
import cs from "./samples_heatmap_view.scss";
import { metricIsZscore } from "./utils";

const parseAndCheckInt = (val: $TSFixMe, defaultVal: $TSFixMe) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

export interface RawBackground {
  mass_normalized: boolean;
  name: string;
  value: number;
  alignmentConfigNames: string[];
}

interface SamplesHeatmapViewProps {
  addedTaxonIds?: $TSFixMeUnknown[];
  backgrounds?: RawBackground[];
  categories?: string[];
  heatmapTs?: number;
  metrics?: { value: string }[];
  name?: string;
  prefilterConstants?: { topN: unknown; minReads: unknown };
  removedTaxonIds?: $TSFixMeUnknown[];
  projectIds?: number[];
  sampleIds?: $TSFixMeUnknown[];
  sampleIdsToProjectIds?: $TSFixMeUnknown[];
  savedParamValues?: { id?: string | number };
  subcategories?: Subcategories;
  taxonLevels?: string[];
  thresholdFilters?: object;
  updateDiscoveryProjectIds?: $TSFixMeFunction;
}

interface SamplsHeatmapViewWithContextProps extends SamplesHeatmapViewProps {
  allowedFeatures: string[];
  trackEvent: TrackEventType;
  updateDiscoveryProjectIds: (projectIds: number[] | null) => void;
  withAnalytics: WithAnalyticsType;
}

interface SamplesHeatmapViewState {
  selectedOptions: SelectedOptions;
  heatmapCreationModalOpen: boolean;
  downloadModalOpen: boolean;
  loading: boolean;
  loadingFailed: boolean;
  selectedMetadata: string[];
  sampleIds: $TSFixMe[];
  invalidSampleNames: $TSFixMe[];
  sampleDetails: object;
  allTaxonIds: $TSFixMe[];
  allSpeciesIds: $TSFixMe[];
  allGeneraIds: $TSFixMe[];
  taxonIds: $TSFixMe[];
  addedTaxonIds: Set<$TSFixMe>;
  notifiedFilteredOutTaxonIds: Set<$TSFixMe>;
  allTaxonDetails: AllTaxonDetails;
  allData: object;
  allPathogenFlagData: string[][][];
  pathogenFlags?: PathogenFlags;
  pathogenFlagData: string[][][];
  data: Record<string, number[][]>;
  hideFilters: boolean;
  selectedSampleId: $TSFixMe;
  sidebarMode: $TSFixMe;
  sidebarVisible: boolean;
  sidebarTaxonModeConfig: $TSFixMe;
  taxonFilterState: Record<string, Record<string, boolean>>;
  pendingPinnedSampleIds: Set<$TSFixMe>;
  pinnedSampleIds: Set<$TSFixMe>;
  newestTaxonId?: $TSFixMe;
  metadataTypes?: $TSFixMe;
  enableMassNormalizedBackgrounds?: $TSFixMe;
}

interface TaxonDetails {
  category?: string;
  genusName?: string;
  id?: number;
  index?: number;
  name?: string;
  parentId?: number;
  phage?: boolean;
  sampleCount?: number;
  taxLevel?: number;
}

export interface PathogenFlags {
  [key: string]: {
    [key: string]: string[];
  };
}

interface AllTaxonDetails {
  [key: string]: TaxonDetails;
}

class SamplesHeatmapViewCC extends React.Component<
  SamplsHeatmapViewWithContextProps,
  SamplesHeatmapViewState
> {
  heatmapVis: $TSFixMe;
  id: $TSFixMe;
  lastRequestToken: $TSFixMe;
  lastSavedParamValues: $TSFixMe;
  metadataSortAsc: $TSFixMe;
  metadataSortField: $TSFixMe;
  removedTaxonIds: $TSFixMe;
  s: $TSFixMe;
  urlParams: $TSFixMe;
  urlParser: $TSFixMe;
  constructor(props: SamplsHeatmapViewWithContextProps) {
    super(props);

    this.urlParser = new UrlQueryParser(URL_FIELDS);
    this.urlParams = this.parseUrlParams();
    // URL params have precedence
    this.urlParams = {
      ...this.parseSavedParams(),
      ...this.urlParams,
    };

    const background = parseAndCheckInt(this.urlParams.background, null);

    this.initOnBeforeUnload(props.savedParamValues);
    // IMPORTANT NOTE: These default values should be kept in sync with the
    // backend defaults in HeatmapHelper for sanity.
    this.state = {
      selectedOptions: {
        metric: this.getSelectedMetric(background),
        categories: this.urlParams.categories || [],
        subcategories: this.urlParams.subcategories || {},
        background: background,
        species: parseAndCheckInt(this.urlParams.species, 1),
        sampleSortType: this.urlParams.sampleSortType || "cluster",
        taxaSortType: this.urlParams.taxaSortType || "cluster",
        thresholdFilters: this.checkThresholdFilters(background),
        dataScaleIdx: parseAndCheckInt(this.urlParams.dataScaleIdx, 0),
        // Based on the trade-off between performance and information quantity, we
        // decided on 10 as the best default number of taxons to show per sample.
        taxonsPerSample: parseAndCheckInt(this.urlParams.taxonsPerSample, 10),
        readSpecificity: parseAndCheckInt(this.urlParams.readSpecificity, 1),
        presets: this.urlParams.presets || [],
        taxonTags: this.urlParams.taxonTags || [],
      },
      heatmapCreationModalOpen: false,
      downloadModalOpen: false,
      loading: false,
      loadingFailed: false,
      selectedMetadata: this.urlParams.selectedMetadata || [
        "collection_location_v2",
      ],
      sampleIds: compact(
        map(parseAndCheckInt, this.urlParams.sampleIds || this.props.sampleIds),
      ),
      invalidSampleNames: [],
      sampleDetails: {},
      allTaxonIds: [],
      allSpeciesIds: [],
      allGeneraIds: [],
      taxonIds: [],
      addedTaxonIds: new Set(
        this.urlParams.addedTaxonIds || this.props.addedTaxonIds || [],
      ),
      // notifiedFilteredOutTaxonIds keeps track of the taxon ids for which
      // we have already notified the user that they have manually added
      // but did not pass filters.
      // This is to ensure that we do not notify the user of ALL
      // manually added taxa that failed filters every time they
      // make a selection in the Add Taxon dropdown.
      // This will be reset whenever filters change, so the user will be
      // notified of which manually added taxa do not pass the new filters.
      notifiedFilteredOutTaxonIds: new Set(
        this.urlParams.addedTaxonIds || this.props.addedTaxonIds || [],
      ),
      allTaxonDetails: {},
      // allData is an object containing all the metric data for every taxa for each sample.
      // The key corresponds to the metric type (e.g. NT.rpm), and the value is 2D array;
      // rows correspond to taxa and columns correspond to samples.
      // Note that the 2D array is accesed by a taxon's/sample's INDEX, not id.
      allData: {},
      // data is an object containing metric data for only the samples that have passed filters
      // and are displayed on the heatmap. data is only a subset of allData if client-side
      // filtering is enabled, otherwise they should be identical.
      data: {},
      allPathogenFlagData: [],
      pathogenFlagData: [],
      hideFilters: false,
      // If we made the sidebar visibility depend on sampleId !== null,
      // there would be a visual flicker when sampleId is set to null as the sidebar closes.
      selectedSampleId: null,
      sidebarMode: null,
      sidebarVisible: false,
      sidebarTaxonModeConfig: null,
      taxonFilterState: {},
      pendingPinnedSampleIds: new Set(),
      pinnedSampleIds: new Set(),
    };

    this.removedTaxonIds = new Set(
      this.urlParams.removedTaxonIds || this.props.removedTaxonIds || [],
    );
    this.metadataSortField = this.urlParams.metadataSortField;
    this.metadataSortAsc = this.urlParams.metadataSortAsc;

    this.lastRequestToken = null;
  }

  getDefaultSelectedOptions = () => {
    const { backgrounds } = this.props;

    return {
      metric: "NT.rpm",
      categories: [],
      subcategories: {},
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      background: backgrounds[0].value,
      species: 1,
      sampleSortType: "cluster",
      taxaSortType: "cluster",
      thresholdFilters: [],
      dataScaleIdx: 0,
      taxonsPerSample: 10,
      readSpecificity: 1,
      taxonTags: [],
    };
  };

  // For converting legacy URLs
  // this.urlParams.metric is a string, e.g "NT.zscore"
  // this.props.metrics is an object of { text, value }
  getSelectedMetric(background: number | null) {
    const urlMetricInProps = this.props.metrics
      ?.map(m => m.value)
      .includes(this.urlParams.metric);
    if (
      (metricIsZscore(this.urlParams.metric) && !background) ||
      !urlMetricInProps
    ) {
      return this.props.metrics?.[0]?.value;
    } else {
      return this.urlParams.metric;
    }
  }

  initOnBeforeUnload(savedParamValues: $TSFixMe) {
    // Initialize to the params passed from the database, then onSaveClick will
    // update on save.
    this.lastSavedParamValues = Object.assign({}, savedParamValues);
    window.onbeforeunload = () => {
      const urlParams = this.getUrlParams();
      // urlParams will be empty before the heatmap data has been fetched.
      if (
        !isEmpty(urlParams) &&
        !DeepEqual(urlParams, this.lastSavedParamValues)
      ) {
        // NOTE: Starting with Firefox 44, Chrome 51, Opera 38, and Safari 9.1,
        // a generic string not under the control of the webpage will be shown
        // instead of the returned string. See
        // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
        return "You have unsaved changes. Are you sure you want to leave this page?";
      }
    };
  }

  componentDidMount() {
    const { projectIds, updateDiscoveryProjectIds } = this.props;

    this.fetchViewData();
    updateDiscoveryProjectIds(uniq(projectIds));
  }

  parseUrlParams = () => {
    const urlParams = queryString.parse(location.search, {
      arrayFormat: "bracket",
    });

    // consider the cases where variables can be passed as array string
    if (typeof urlParams.sampleIds === "string") {
      urlParams.sampleIds = urlParams.sampleIds.split(",");
    }
    if (typeof urlParams.taxonTags === "string") {
      urlParams.taxonTags = urlParams.taxonTags.split(",");
    }
    if (typeof urlParams.addedTaxonIds === "string") {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'Set<number>' is not assignable to type 'stri... Remove this comment to see the full error message
      urlParams.addedTaxonIds = new Set(
        urlParams.addedTaxonIds.split(",").map(parseInt),
      );
    } else if (typeof urlParams.addedTaxonIds === "object") {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'Set<number>' is not assignable to type 'stri... Remove this comment to see the full error message
      urlParams.addedTaxonIds = new Set(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        urlParams.addedTaxonIds.map(id => parseInt(id)),
      );
    }
    if (typeof urlParams.removedTaxonIds === "string") {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'Set<number>' is not assignable to type 'stri... Remove this comment to see the full error message
      urlParams.removedTaxonIds = new Set(
        urlParams.removedTaxonIds.split(",").map(parseInt),
      );
    } else if (typeof urlParams.removedTaxonIds === "object") {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'Set<number>' is not assignable to type 'stri... Remove this comment to see the full error message
      urlParams.removedTaxonIds = new Set(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        urlParams.removedTaxonIds.map(id => parseInt(id)),
      );
    }
    if (typeof urlParams.categories === "string") {
      urlParams.categories = urlParams.categories.split(",");
    }
    if (typeof urlParams.subcategories === "string") {
      urlParams.subcategories = JSON.parse(urlParams.subcategories);
    }
    if (typeof urlParams.thresholdFilters === "string") {
      // If the saved threshold object doesn't have metricDisplay, add it. For backwards compatibility.
      // See also parseSavedParams().
      // TODO: should remove this when the Visualization table is cleaned up.
      urlParams.thresholdFilters = map(
        threshold => ({
          metricDisplay: get(
            "text",
            find(
              ["value", threshold.metric],
              // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
              this.props.thresholdFilters.targets,
            ),
          ),
          ...threshold,
        }),
        JSON.parse(urlParams.thresholdFilters),
      );
    }
    if (typeof urlParams.selectedMetadata === "string") {
      urlParams.selectedMetadata = urlParams.selectedMetadata.split(",");
    }
    if (typeof urlParams.metadataSortAsc === "string") {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'string |... Remove this comment to see the full error message
      urlParams.metadataSortAsc = urlParams.metadataSortAsc === "true";
    }
    return urlParams;
  };

  parseSavedParams = () => {
    // If the saved threshold object doesn't have metricDisplay, add it. For backwards compatibility.
    // See also parseUrlParams().
    // TODO: should remove this when the Visualization table is cleaned up.
    const savedParams = this.props.savedParamValues;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholdFilters' does not exist on type... Remove this comment to see the full error message
    if (savedParams && savedParams.thresholdFilters) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholdFilters' does not exist on type... Remove this comment to see the full error message
      savedParams.thresholdFilters = map(
        threshold => ({
          metricDisplay: get(
            "text",
            find(
              ["value", threshold.metric],
              // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
              this.props.thresholdFilters.targets,
            ),
          ),
          ...threshold,
        }),
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholdFilters' does not exist on type... Remove this comment to see the full error message
        savedParams.thresholdFilters,
      );
      return savedParams;
    }
  };

  getUrlParams = () => {
    return Object.assign(
      {
        id: this.id,
        selectedMetadata: this.state.selectedMetadata,
        metadataSortField: this.metadataSortField,
        metadataSortAsc: this.metadataSortAsc,
        addedTaxonIds: Array.from(this.state.addedTaxonIds),
        removedTaxonIds: Array.from(this.removedTaxonIds),
        sampleIds: this.state.sampleIds,
      },
      this.state.selectedOptions,
    );
  };

  checkThresholdFilters = (background: number | null) => {
    let thresholdFilters = this.urlParams.thresholdFilters || [];
    if (!background) {
      thresholdFilters = thresholdFilters.filter(
        (threshold: ThresholdFilterData) => !metricIsZscore(threshold.metric),
      );
    }
    return thresholdFilters;
  };

  prepareParams = (removeFilters = false) => {
    const params = this.getUrlParams();
    if (removeFilters) {
      const removedParams = omit(APPLIED_FILTERS, params);
      return queryString.stringify(removedParams, { arrayFormat: "bracket" });
    } else {
      // Parameters stored as objects
      const newParams = {
        ...params,
        thresholdFilters: JSON.stringify(params.thresholdFilters),
        subcategories: JSON.stringify(params.subcategories),
      };
      return queryString.stringify(newParams, { arrayFormat: "bracket" });
    }
  };

  getUrlForCurrentParams = () => {
    const url = new URL(location.pathname, window.origin);
    return `${url.toString()}?${this.prepareParams()}`;
  };

  getAppliedFilters = () => {
    const { selectedOptions } = this.state;

    // Only Category, Subcategories, Read Specifity, and Threshold Filters are considered "Applied Filters"
    return omit(
      [
        "sampleSortType",
        "taxaSortType",
        "dataScaleIdx",
        "taxonsPerSample",
        "species",
        "background",
        "metricShortReads",
        "metricLongReads",
        "presets",
      ],
      diff(selectedOptions, this.getDefaultSelectedOptions()),
    );
  };

  createCSVRowForSelectedOptions = () => {
    const { backgrounds } = this.props;
    const { selectedOptions } = this.state;
    const { metric, background } = selectedOptions;

    const selectedBackgroundName = background
      ? find({ value: background }, backgrounds)?.name
      : NONE_BACKGROUND.name;
    // We want to show the metric and background selected, but do not consider them as filters.
    const filterRow = [
      `\nMetric:, ${metric}`,
      `Background:, "${selectedBackgroundName}"`,
    ];
    let numberOfFilters = 0;

    for (const [name, val] of Object.entries(this.getAppliedFilters())) {
      if (val === undefined) continue;
      switch (name) {
        case "thresholdFilters": {
          const thresholdFilters = val.reduce(
            (result: $TSFixMe, threshold: $TSFixMe) => {
              result.push(
                `${threshold["metricDisplay"]} ${threshold["operator"]} ${threshold["value"]}`,
              );
              return result;
            },
            [],
          );

          if (!isEmpty(thresholdFilters)) {
            filterRow.push(`Thresholds:, ${thresholdFilters.join()}`);
            ++numberOfFilters;
          }
          break;
        }
        case "categories": {
          filterRow.push(`Categories:, ${val}`);
          numberOfFilters += val.length;
          break;
        }
        case "subcategories": {
          const subcategories = [];
          for (const [subcategoryName, subcategoryVal] of Object.entries(val)) {
            if (!isEmpty(subcategoryVal)) {
              subcategories.push(
                // @ts-expect-error Property 'join' does not exist on type 'unknown'
                `${subcategoryName} - ${subcategoryVal.join()}`,
              );
            }
          }

          filterRow.push(`Subcategories:, ${subcategories}`);
          numberOfFilters += subcategories.length;
          break;
        }
        case "readSpecificity": {
          filterRow.push(
            `Read Specificity:, "${
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
              find({ value: val }, SPECIFICITY_OPTIONS).text
            }"`,
          );
          ++numberOfFilters;
          break;
        }
        case "taxonTags": {
          filterRow.push(`Pathogen Tags: ${val}`);
          numberOfFilters += val.length;
          break;
        }

        default: {
          logError({
            message:
              "SamplesHeatmapView: Invalid filter passed to createCSVRowForSelectedOptions()",
            details: { name, val },
          });
          break;
        }
      }
    }

    const filterStatement =
      numberOfFilters === 0
        ? "No Filters Applied."
        : `${numberOfFilters} Filter${numberOfFilters > 1 ? "s" : ""} Applied:`;
    // Insert filterStatement after Metric and Background
    filterRow.splice(2, 0, filterStatement);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return [sanitizeCSVRow(filterRow).join()];
  };

  getDownloadCurrentViewHeatmapCSVLink = () => {
    const { selectedOptions } = this.state;
    let csvHeaders = [];
    let csvRows = [];
    const naExplanation =
      "NA: Not Applicable; sample did not meet thresholds set";

    if (!this.heatmapVis) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      csvHeaders = ['"Current heatmap view did not render any data"'];
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      csvRows = [['"Please try adjusting the filters or samples selected"']];
    } else {
      [csvHeaders, csvRows] =
        this.heatmapVis.computeCurrentHeatmapViewValuesForCSV({
          headers: compact(["Taxon", selectedOptions.species !== 0 && "Genus"]),
        });
    }

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    csvRows.push(this.createCSVRowForSelectedOptions());
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    csvRows.push([naExplanation]);
    return createCSVObjectURL(csvHeaders, csvRows);
  };

  handleDownloadCsv = () => {
    const url = new URL("/visualizations/download_heatmap", window.origin);
    const href = `${url.toString()}?${this.prepareParams(true)}`;
    // target="_blank" is needed to avoid unload handler
    window.open(href, "_blank");
  };

  handleShareClick = async () => {
    await copyShortUrlToClipboard(this.getUrlForCurrentParams());
  };

  handleSaveClick = async () => {
    const resp = await saveVisualization("heatmap", this.getUrlParams());
    this.lastSavedParamValues = Object.assign({}, this.getUrlParams());
    const url =
      location.protocol +
      "//" +
      location.host +
      "/visualizations/heatmap/" +
      resp.id;
    // Update URL without reloading the page
    history.replaceState(window.history.state, document.title, url);
  };

  handleDownloadSvg = () => {
    this.heatmapVis.download();
  };

  handleDownloadPng = () => {
    this.heatmapVis.downloadAsPng();
  };

  handleHeatmapCreationModalOpen = () => {
    this.setState({ heatmapCreationModalOpen: true });
  };

  handleHeatmapCreationModalClose = () => {
    this.setState({ heatmapCreationModalOpen: false });
  };

  handleDownloadModalOpen = () => {
    this.setState({ downloadModalOpen: true });
  };

  handleDownloadModalClose = () => {
    this.setState({ downloadModalOpen: false });
  };

  handleGenerateBulkDownload = () => {
    this.handleDownloadModalClose();
    showBulkDownloadNotification();
  };

  metricToSortField(metric: $TSFixMe) {
    const fields = metric.split(".");
    const countType = fields[0].toLowerCase();
    const metricName = fields[1].toLowerCase();

    return "highest_" + countType + "_" + metricName;
  }

  async fetchHeatmapData(sampleIds: $TSFixMe) {
    const { heatmapTs } = this.props;
    const {
      presets,
      species,
      categories,
      subcategories,
      metric,
      thresholdFilters,
      taxonsPerSample,
      readSpecificity,
      background,
      taxonTags,
    } = this.state.selectedOptions;

    // If using client-side filtering, the server should still return info
    // related to removed taxa in case the user decides to add the taxon back.
    const removedTaxonIds: $TSFixMe = [];

    if (this.lastRequestToken) {
      this.lastRequestToken.cancel("Parameters changed");
    }
    this.lastRequestToken = axios.CancelToken.source();

    const fetchDataStart = new Date();
    const fetchHeatmapDataParams = {
      sampleIds: sampleIds,
      removedTaxonIds: removedTaxonIds,
      presets: presets,
      species: species,
      categories: categories,
      subcategories: subcategories,
      sortBy: this.metricToSortField(metric),
      thresholdFilters: thresholdFilters,
      taxonsPerSample: taxonsPerSample,
      readSpecificity: readSpecificity,
      background: background,
      heatmapTs: heatmapTs,
      addedTaxonIds: null,
      taxonTags: taxonTags,
    };

    // Made a copy of fetchHeatmapDataParams with values that are compliant with the
    // eventData types. This is to ensure that the data we send to analytics is valid and
    // that we're not making extra, unused tables. fetchHeatmapDataParamsCompliantTypes is
    // only used to send compliant data to Segment.
    const fetchHeatmapDataParamsCompliantTypes = {
      sampleIds: JSON.stringify(fetchHeatmapDataParams.sampleIds),
      removedTaxonIds: fetchHeatmapDataParams.removedTaxonIds,
      presets: JSON.stringify(fetchHeatmapDataParams.presets),
      species: fetchHeatmapDataParams.species,
      categories: JSON.stringify(fetchHeatmapDataParams.categories),
      subcategories: JSON.stringify(fetchHeatmapDataParams.subcategories),
      sortBy: fetchHeatmapDataParams.sortBy,
      thresholdFilters: JSON.stringify(fetchHeatmapDataParams.thresholdFilters),
      taxonsPerSample: fetchHeatmapDataParams.taxonsPerSample,
      readSpecificity: fetchHeatmapDataParams.readSpecificity,
      background: fetchHeatmapDataParams.background,
      heatmapTs: fetchHeatmapDataParams.heatmapTs,
      addedTaxonIds: JSON.stringify(fetchHeatmapDataParams.addedTaxonIds),
      taxonTags: JSON.stringify(fetchHeatmapDataParams.taxonTags),
    };

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    fetchHeatmapDataParams.addedTaxonIds = Array.from(this.state.addedTaxonIds);

    const heatmapData = await getSampleTaxons(
      fetchHeatmapDataParams,
      this.lastRequestToken.token,
    );
    const fetchDataEnd = new Date();
    // @ts-expect-error ts-migrate(2362) FIXME: The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
    const loadTimeInMilliseconds = fetchDataEnd - fetchDataStart;

    this.props.trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED,
      {
        ...fetchHeatmapDataParamsCompliantTypes,
        loadTimeInMilliseconds,
        useHeatmapES: true,
      },
    );

    return heatmapData;
  }

  fetchMetadataFieldsBySampleIds(sampleIds: $TSFixMe) {
    if (this.state.metadataTypes) return null;
    return getSampleMetadataFields(sampleIds);
  }

  async fetchViewData() {
    const { backgrounds } = this.props;
    const { sampleIds } = this.state;
    const selectedBackgroundId = this.state.selectedOptions.background;

    this.setState({ loading: true }); // Gets false from this.filterTaxaES

    const { validIds, invalidSampleNames } = await validateSampleIds({
      sampleIds,
      workflow: WorkflowType.SHORT_READ_MNGS,
    });

    this.setState(
      {
        sampleIds: validIds,
        invalidSampleNames,
      },
      // If there are failed/waiting samples selected, display a warning
      // to the user that they won't appear in the heatmap.
      () =>
        invalidSampleNames.length > 0 &&
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
        this.showNotification(NOTIFICATION_TYPES.invalidSamples),
    );

    let heatmapData, metadataFields;
    try {
      [heatmapData, metadataFields] = await Promise.all([
        this.fetchHeatmapData(validIds),
        this.fetchMetadataFieldsBySampleIds(validIds),
      ]);
    } catch (err) {
      this.handleLoadingFailure(err);
      return; // Return early so that loadingFailed is not set to false later
    }

    const pipelineVersions = compact(
      map(property("pipeline_version"), heatmapData),
    );
    const pipelineMajorVersionsSet = new Set(
      map(
        pipelineVersion => `${pipelineVersion.split(".")[0]}.x`,
        pipelineVersions,
      ),
    );

    if (pipelineMajorVersionsSet.size > 1) {
      this.showNotification(NOTIFICATION_TYPES.multiplePipelineVersions, [
        ...pipelineMajorVersionsSet,
      ]);
    }

    // set of unique alignment config names for samples
    const indexVersions = uniq(
      compact(map(property("alignment_config_name"), heatmapData)),
    );

    let backgroundIndexVersions: string[] = [];
    if (selectedBackgroundId) {
      backgroundIndexVersions =
        find({ value: selectedBackgroundId }, backgrounds)
          ?.alignmentConfigNames || [];
    }

    // alignment configs in background not in samples
    const nonMatchingBackgroundIndexVersions = pullAll(
      indexVersions,
      backgroundIndexVersions,
    );

    // if samples have multiple index versions, show samples warning
    // if samples have same index version but background doesn't match, show bg warning
    if (indexVersions.length > 1) {
      this.showNotification(
        NOTIFICATION_TYPES.multipleIndexVersions,
        indexVersions,
      );
    } else if (nonMatchingBackgroundIndexVersions.length > 0) {
      this.showNotification(
        NOTIFICATION_TYPES.backgroundDifferentIndexVersion,
        {},
      );
    }

    let newState = {};
    if (!isEmpty(heatmapData)) {
      newState = this.extractData(heatmapData);
    }

    // Only calculate the metadataTypes once.
    if (metadataFields !== null) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'metadataTypes' does not exist on type '{... Remove this comment to see the full error message
      newState.metadataTypes = metadataFields;
    }
    // @ts-expect-error Property 'loadingFailed' does not exist on type '{}'.
    newState.loadingFailed = false;

    this.updateHistoryState();
    // this.state.loading will be set to false at the end of updateFilters
    this.setState(newState, this.filterTaxaES);
  }

  handleLoadingFailure = (err: $TSFixMe) => {
    const { allTaxonIds, sampleIds } = this.state;

    this.setState({
      loading: false,
      loadingFailed: true,
    });

    const logSingleError = (e: $TSFixMe) => {
      const errorMessage = `SamplesHeatmapView: Error loading heatmap data from ElasticSearch`;
      logError({
        message: errorMessage,
        details: {
          err: e,
          href: window.location.href,
          message: e?.message ?? errorMessage,
          sampleIds,
          status: e?.status,
          statusText: e?.statusText,
          usesElasticSearch: true,
        },
      });
    };

    if (Array.isArray(err)) {
      err.forEach(e => logSingleError(e));
    } else {
      logSingleError(err);
    }

    this.props.trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIEW_LOADING_ERROR,
      {
        numSamples: size(sampleIds),
        numTaxons: size(allTaxonIds),
        sampleIds: JSON.stringify(sampleIds),
        useHeatmapES: true,
      },
    );
  };

  extractData(rawData: $TSFixMe) {
    const sampleIds = [];
    const sampleNamesCounts = new Map();
    const sampleDetails = {};
    const allTaxonIds = [];
    const allSpeciesIds = [];
    const allGeneraIds = [];
    const allTaxonDetails = {};
    const allData = {};
    const allPathogenFlagData = [];
    const taxonFilterState = {};
    const { pathogenFlags } = this.state;
    // Check if all samples have ERCC counts > 0 to enable backgrounds generated
    // using normalized input mass.
    let enableMassNormalizedBackgrounds = true;

    for (let i = 0; i < rawData.length; i++) {
      const sample = rawData[i];
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      sampleIds.push(sample.sample_id);

      enableMassNormalizedBackgrounds =
        sample.ercc_count > 0 &&
        isPipelineFeatureAvailable(
          MASS_NORMALIZED_FEATURE,
          sample.pipeline_version,
        ) &&
        enableMassNormalizedBackgrounds;

      // Keep track of samples with the same name, which may occur if
      // a user selects samples from multiple projects.
      if (sampleNamesCounts.has(sample.name)) {
        // Append a number to a sample's name to differentiate between samples with the same name.
        const count = sampleNamesCounts.get(sample.name);
        const originalName = sample.name;
        sample.name = `${sample.name} (${count})`;
        sampleNamesCounts.set(originalName, count + 1);
      } else {
        sampleNamesCounts.set(sample.name, 1);
      }

      sampleDetails[sample.sample_id] = {
        id: sample.sample_id,
        name: sample.name,
        index: i,
        host_genome_name: sample.host_genome_name,
        metadata: processMetadata({
          metadata: sample.metadata,
          flatten: true,
        }),
        taxa: [],
        duplicate: false,
      };
      if (sample.taxons) {
        for (let j = 0; j < sample.taxons.length; j++) {
          const taxon = sample.taxons[j];
          let taxonIndex: $TSFixMe;
          if (taxon.tax_id in allTaxonDetails) {
            taxonIndex = allTaxonDetails[taxon.tax_id].index;
            allTaxonDetails[taxon.tax_id].sampleCount += 1;
          } else {
            taxonIndex = allTaxonIds.length;
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
            allTaxonIds.push(taxon.tax_id);

            if (taxon.tax_level === TAXON_LEVEL_OPTIONS["species"]) {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
              allSpeciesIds.push(taxon.tax_id);
            } else {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
              allGeneraIds.push(taxon.tax_id);
            }

            allTaxonDetails[taxon.tax_id] = {
              id: taxon.tax_id,
              index: taxonIndex,
              name: taxon.name,
              category: taxon.category_name,
              parentId:
                taxon.tax_id === taxon.species_taxid && taxon.genus_taxid,
              phage: !!taxon.is_phage,
              genusName: taxon.genus_name,
              taxLevel: taxon.tax_level,
              sampleCount: 1,
            };
            allTaxonDetails[taxon.name] = allTaxonDetails[taxon.tax_id];
          }

          sampleDetails[sample.sample_id].taxa.push(taxon.tax_id);

          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          this.props.metrics.forEach(metric => {
            const [metricType, metricName] = metric.value.split(".");
            allData[metric.value] = allData[metric.value] || [];
            allData[metric.value][taxonIndex] =
              allData[metric.value][taxonIndex] || [];
            allData[metric.value][taxonIndex][i] =
              taxon[metricType][metricName];
          });

          // in the feature flag-off case, this array still needs to be constructed because
          // we cannot do feature flag checks in Heatmap.js and this array must be passed
          // to that component

          // add to the 2D array of pathogen flags that will be rendered on the heatmap
          const sampleCount = rawData.length;
          allPathogenFlagData[taxonIndex] =
            allPathogenFlagData[taxonIndex] || Array(sampleCount); // make a sparse array of the correct size
          const pathogenFlagsForSampleAndTaxon = get(
            [sample.sample_id, taxon.tax_id],
            pathogenFlags,
          );
          if (pathogenFlagsForSampleAndTaxon) {
            allPathogenFlagData[taxonIndex][i] =
              allPathogenFlagData[taxonIndex][i] || [];
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
            allPathogenFlagData[taxonIndex][i].push(
              ...pathogenFlagsForSampleAndTaxon,
            );
          }
        }
      }
    }

    return {
      // The server should always pass back the same set of sampleIds, but possibly in a different order.
      // We overwrite both this.state.sampleDetails and this.state.sampleIds to make sure the two are in sync.
      sampleIds,
      sampleDetails,
      allTaxonIds,
      allSpeciesIds,
      allGeneraIds,
      allTaxonDetails,
      allData,
      allPathogenFlagData,
      taxonFilterState,
      enableMassNormalizedBackgrounds,
    };
  }

  fetchBackgroundData() {
    return getTaxaDetails({
      sampleIds: this.state.sampleIds,
      taxonIds: Array.from(this.state.allTaxonIds),
      // If using client-side filtering, the server should still return info
      // related to removed taxa in case the user decides to add the taxon back.
      removedTaxonIds: [],
      background: this.state.selectedOptions.background,
      updateBackgroundOnly: true,
      heatmapTs: this.props.heatmapTs,
      presets: this.state.selectedOptions.presets,
    });
  }

  async fetchBackground() {
    this.setState({ loading: true }); // Gets false from this.filterTaxaES
    let backgroundData;
    try {
      backgroundData = await this.fetchBackgroundData();
    } catch (err) {
      this.handleLoadingFailure(err);
      return; // Return early so that loadingFailed is not set to false later
    }

    const newState = this.extractBackgroundMetrics(backgroundData);
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'loadingFailed' does not exist on type '{... Remove this comment to see the full error message
    newState.loadingFailed = false;

    this.updateHistoryState();
    this.setState(newState, this.filterTaxaES);
  }

  extractBackgroundMetrics(rawData: $TSFixMe) {
    const { sampleDetails, allTaxonDetails, allData } = this.state;

    // The server should always pass back the same set of samples and taxa,
    // but possibly in a different order, so we need to match them up to their
    // respective indices based on their ids.
    for (let i = 0; i < rawData.length; i++) {
      const sample = rawData[i];
      const sampleIndex = sampleDetails[sample.sample_id].index;

      if (sample.taxons) {
        for (let j = 0; j < sample.taxons.length; j++) {
          const taxon = sample.taxons[j];
          const taxonIndex = allTaxonDetails[taxon.tax_id].index;

          BACKGROUND_METRICS.forEach((metric: BackgroundMetricType) => {
            const [metricType, metricName] = metric.value.split(".");
            allData[metric.value] = allData[metric.value] || [];
            allData[metric.value][taxonIndex] =
              allData[metric.value][taxonIndex] || [];
            allData[metric.value][taxonIndex][sampleIndex] =
              taxon[metricType][metricName];
          });
        }
      }
    }

    return { allData };
  }

  filterTaxa() {
    const { taxonFilterState, taxonPassesThresholdFilters } =
      this.getTaxonThresholdFilterState();
    const { allTaxonIds, notifiedFilteredOutTaxonIds, addedTaxonIds } =
      this.state;
    let { newestTaxonId } = this.state;
    const { allTaxonDetails } = this.state;
    let taxonIds = new Set();
    let filteredData = {};

    allTaxonIds.forEach((taxonId: $TSFixMe) => {
      const taxon = allTaxonDetails[taxonId];
      if (
        !taxonIds.has(taxonId) &&
        this.taxonPassesSelectedFilters(taxon) &&
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        taxonPassesThresholdFilters[taxon["index"]]
      ) {
        taxonIds.add(taxon["id"]);
      } else {
        // Check notifiedFilteredOutTaxonIds to prevent filtered out taxa from
        // notifying the user every time a selection is made.
        if (
          addedTaxonIds.has(taxon["id"]) &&
          !notifiedFilteredOutTaxonIds.has(taxon["id"])
        ) {
          this.showNotification(NOTIFICATION_TYPES.taxaFilteredOut, taxon);
          notifiedFilteredOutTaxonIds.add(taxon["id"]);
          newestTaxonId = null;
        }
      }
    });

    filteredData = this.state.allData;
    // @ts-expect-error ts-migrate(2740) FIXME: Type 'unknown[]' is missing the following properti... Remove this comment to see the full error message
    taxonIds = Array.from(taxonIds);

    this.updateHistoryState();

    this.setState({
      taxonFilterState,
      // @ts-expect-error Type 'Set<unknown>' is missing the following properties from type 'any[]'
      taxonIds,
      loading: false,
      data: filteredData,
      notifiedFilteredOutTaxonIds,
      newestTaxonId,
    });
  }

  filterTaxaES() {
    const {
      sampleDetails,
      allData,
      allPathogenFlagData,
      allTaxonDetails,
      addedTaxonIds,
    } = this.state;
    const { metrics } = this.props;

    // use the frontend filtering logic to identify all taxons that do not pass the filters
    // these are still showed on the heatmap but they will be greyed out
    // TODO figure out how to have the backend tag taxons that don't pass the filters
    const { taxonFilterState } = this.getTaxonThresholdFilterState();

    const filteredData = {};
    const filteredPathogenFlagData = [];
    const filteredTaxIds = new Set();

    const taxIdsPerSample = Object.values(sampleDetails).map(d => d.taxa);
    const sampleTaxIds = new Set(flatten(taxIdsPerSample));
    // Make sure that taxa manually added by the user that pass filters
    // are included.
    const sampleAndAddedTaxa = [...sampleTaxIds, ...addedTaxonIds];

    // TODO this filtereData and filteredPathogenFlagData building may be able to occur
    // in extractData instead. The only client-side filtering that appears to occur here
    // is removing rows for taxa that have been manually removed by the user.
    for (const taxId of sampleAndAddedTaxa) {
      if (!filteredTaxIds.has(taxId) && !this.removedTaxonIds.has(taxId)) {
        // build Set of all passing tax ids
        filteredTaxIds.add(taxId);

        // rebuilding the filteredData manually seems to be the easiest way
        // to filter
        const taxon = allTaxonDetails[taxId];
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        metrics.forEach(metric => {
          filteredData[metric.value] = filteredData[metric.value] || [];
          filteredData[metric.value].push(
            allData[metric.value][taxon["index"]],
          );
        });

        // rebuild the filteredPathogenFlagData as well
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        filteredPathogenFlagData.push(allPathogenFlagData[taxon["index"]]);
      }
    }

    this.updateHistoryState();

    this.setState({
      taxonFilterState,
      taxonIds: Array.from(filteredTaxIds),
      loading: false,
      data: filteredData,
      pathogenFlagData: filteredPathogenFlagData,
    });
  }

  getTaxonThresholdFilterState() {
    // Set the state of whether or not a taxon passes the custom threshold filters
    // for each selected sample.
    const { sampleDetails, allTaxonDetails, allData, taxonFilterState } =
      this.state;
    const taxonPassesThresholdFilters = {};
    Object.values(sampleDetails).forEach((sample: $TSFixMe) => {
      Object.values(allTaxonDetails).forEach((taxon: $TSFixMe) => {
        taxonFilterState[taxon["index"]] =
          taxonFilterState[taxon["index"]] || {};
        // eslint-disable-next-line standard/computed-property-even-spacing
        taxonFilterState[taxon["index"]][sample["index"]] =
          this.taxonThresholdFiltersCheck(sample["index"], taxon, allData);

        taxonPassesThresholdFilters[taxon["index"]] =
          taxonPassesThresholdFilters[taxon["index"]] ||
          taxonFilterState[taxon["index"]][sample["index"]];
      });
    });
    return {
      taxonFilterState: taxonFilterState,
      taxonPassesThresholdFilters: taxonPassesThresholdFilters,
    };
  }

  taxonThresholdFiltersCheck(
    sampleIndex: $TSFixMe,
    taxonDetails: $TSFixMe,
    data: $TSFixMe,
  ) {
    const { thresholdFilters } = this.state.selectedOptions;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    for (const filter of thresholdFilters) {
      // Convert metric name format from "NT_zscore" to "NT.zscore"
      const metric = filter["metric"].split("_").join(".");
      if (Object.keys(data).includes(metric)) {
        const value = data[metric][taxonDetails["index"]][sampleIndex];
        if (!value) {
          return false;
        }
        if (filter["operator"] === ">=") {
          if (value < parseFloat(filter["value"])) {
            return false;
          }
        } else if (
          filter["operator"] === "<=" &&
          value > parseFloat(filter["value"])
        ) {
          return false;
        }
      }
    }
    return true;
  }

  taxonPassesSelectedFilters(taxonDetails: $TSFixMe) {
    const {
      readSpecificity,
      categories,
      subcategories,
      species, // 0 for genus mode, 1 for species mode
      // taxonTags,
    } = this.state.selectedOptions;
    const phageSelected =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      subcategories["Viruses"] && subcategories["Viruses"].includes("Phage");

    if (
      (species && taxonDetails["taxLevel"] !== 1) ||
      (!species && taxonDetails["taxLevel"] !== 2)
    ) {
      return false;
    }
    if (readSpecificity && taxonDetails["id"] < 0) {
      // NOTE(2021-07-15): This intentionally does not filter for
      // taxonDetails["parentId"] < 0 because we are treating the behavior
      // differently from the Report Page for now. The Report Page equivalent is
      // filterReadSpecificity in SampleView.jsx.
      //
      // On both the Report Page and Heatmap in Specific-Only Mode, a
      // non-specific species is hidden.
      //
      // On the Report Page in Specific-Only Mode, a specific species with a
      // non-specific genus is hidden because the genus row is filtered out.
      //
      // On the Heatmap in Specific-Only Mode, a specific species with a
      // non-specific genus is shown because the heatmap displays species or
      // genus rows by themselves.
      //
      // We intend to make the behavior more consistent or clearer but it is To
      // Be Decided: https://app.clubhouse.io/idseq/story/135993
      return false;
    }
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (categories.length) {
      if (!phageSelected && taxonDetails["phage"]) {
        return false;
      }
      if (
        // Consider using the regular array includes function,
        // once we guarantee that all data is lower case
        !ArrayUtils.caseInsensitiveIncludes(
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          categories,
          taxonDetails["category"],
        ) &&
        !(phageSelected && taxonDetails["phage"])
      ) {
        return false;
      }
    } else if (phageSelected && !taxonDetails["phage"]) {
      // Exclude non-phages if only the phage subcategory is selected.
      return false;
    }
    return true;
  }

  handleMetadataUpdate = (key: $TSFixMe, value: $TSFixMe) => {
    this.setState({
      sampleDetails: set(
        [this.state.selectedSampleId, "metadata", key],
        value,
        this.state.sampleDetails,
      ),
    });
  };

  updateHistoryState = () => {
    window.history.replaceState("", "", this.getUrlForCurrentParams());
  };

  fetchNewTaxa(taxaMissingInfo: $TSFixMe) {
    return getTaxaDetails({
      sampleIds: this.state.sampleIds,
      taxonIds: taxaMissingInfo,
      removedTaxonIds: [],
      background: this.state.selectedOptions.background,
      updateBackgroundOnly: false,
      heatmapTs: this.props.heatmapTs,
    });
  }

  async updateTaxa(taxaMissingInfo: $TSFixMe) {
    // Given a list of taxa for which details are currently missing,
    // fetch the information for those taxa from the server and
    // update the appropriate data structures to include the new taxa.
    this.setState({ loading: true }); // Gets false from this.filterTaxaES

    const newTaxaInfo = await this.fetchNewTaxa(taxaMissingInfo);
    const extractedData = this.extractData(newTaxaInfo);

    const {
      allData,
      allPathogenFlagData,
      allGeneraIds,
      allSpeciesIds,
      allTaxonIds,
      allTaxonDetails,
      sampleDetails,
    } = this.state;
    const tempAllData = extractedData.allData;

    // THESE LINT ERRORS LOOK LIKE BUGS - including the two concats and the map below
    // I (ehoops) am not changing functionality in this PR, but we should look into this.
    // eslint-disable-next-line
    allGeneraIds.concat(extractedData.allGeneraIds);
    // eslint-disable-next-line
    allSpeciesIds.concat(extractedData.allSpeciesIds);

    extractedData.allTaxonIds.forEach(taxonId => {
      const taxon = extractedData.allTaxonDetails[taxonId];
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      const tempTaxonIndex = taxon.index;
      const taxonIndex = allTaxonIds.length;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      taxon.index = taxonIndex;

      allTaxonIds.push(taxonId);
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      allTaxonDetails[taxon.id] = taxon;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
      allTaxonDetails[taxon.name] = taxon;

      // eslint-disable-next-line
      Object.entries(sampleDetails).map(([sampleId, sample]) => {
        sample.taxa.concat(extractedData.sampleDetails[sampleId].taxa);
        const sampleIndex = sample.index;
        const tempSampleIndex = extractedData.sampleDetails[sampleId].index;

        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        this.props.metrics.forEach(metric => {
          allData[metric.value][taxonIndex] =
            allData[metric.value][taxonIndex] || [];
          allData[metric.value][taxonIndex][sampleIndex] =
            tempAllData[metric.value][tempTaxonIndex][tempSampleIndex];
        });

        allPathogenFlagData[taxonIndex] = allPathogenFlagData[taxonIndex] || [];
        allPathogenFlagData[taxonIndex][sampleIndex] =
          extractedData.allPathogenFlagData[tempTaxonIndex][tempSampleIndex];
      });
    });
    this.setState(
      {
        allData,
        allPathogenFlagData,
        allGeneraIds,
        allSpeciesIds,
        allTaxonIds,
        allTaxonDetails,
        sampleDetails,
      },
      this.filterTaxaES,
    );
  }

  handleAddedTaxonChange = (selectedTaxonIds: $TSFixMe) => {
    // selectedTaxonIds includes taxa that pass filters
    // and the taxa manually added by the user.
    const {
      taxonIds,
      addedTaxonIds,
      notifiedFilteredOutTaxonIds,
      allTaxonIds,
    } = this.state;

    // currentAddedTaxa is all the taxa manually added by the user.
    const newlyAddedTaxa = difference(
      [...selectedTaxonIds],
      [...new Set([...taxonIds, ...addedTaxonIds])],
    );
    const previouslyAddedTaxa = intersection(
      [...addedTaxonIds],
      [...selectedTaxonIds],
    );
    const currentAddedTaxa = new Set([
      ...newlyAddedTaxa,
      ...previouslyAddedTaxa,
    ]);
    const newestTaxonId = newlyAddedTaxa[newlyAddedTaxa.length - 1];

    // Update notifiedFilteredOutTaxonIds to remove taxa that were unselected.
    const currentFilteredOutTaxonIds = new Set(
      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      intersection(notifiedFilteredOutTaxonIds, currentAddedTaxa),
    );

    // removedTaxonIds are taxa that passed filters
    // but were manually unselected by the user.
    const removedTaxonIds = new Set(
      difference(taxonIds, [...selectedTaxonIds]),
    );
    removedTaxonIds.forEach(taxId => this.removedTaxonIds.add(taxId));
    selectedTaxonIds.forEach((taxId: $TSFixMe) => {
      this.removedTaxonIds.delete(taxId);
    });

    // If the user has selected a taxon from the dropdown whose data wasn't initially
    // loaded in (for example, if the taxon has < 5 reads), then fetch its info.
    const taxaMissingInfo = difference([...selectedTaxonIds], allTaxonIds);

    this.setState(
      {
        addedTaxonIds: currentAddedTaxa,
        notifiedFilteredOutTaxonIds: currentFilteredOutTaxonIds,
        newestTaxonId,
      },
      () => {
        if (taxaMissingInfo.length > 0) {
          this.updateTaxa(taxaMissingInfo);
        } else {
          this.filterTaxaES();
        }
      },
    );
    this.updateHistoryState();
  };

  handleRemoveTaxon = (taxonName: $TSFixMe) => {
    const { addedTaxonIds } = this.state;
    const taxonId = this.state.allTaxonDetails[taxonName].id;
    this.removedTaxonIds.add(taxonId);

    // Only update state if something changed (slightly faster not to update state when not necessary)
    if (addedTaxonIds.has(taxonId)) {
      addedTaxonIds.delete(taxonId);
      this.setState({ addedTaxonIds }, this.filterTaxaES);
    } else {
      this.filterTaxaES();
    }
  };

  handleMetadataChange = (metadataFields: $TSFixMe) => {
    this.setState({
      selectedMetadata: Array.from(metadataFields),
    });
    this.updateHistoryState();
  };

  handleMetadataSortChange = (field: $TSFixMe, dir: $TSFixMe) => {
    this.metadataSortField = field;
    this.metadataSortAsc = dir;
    this.updateHistoryState();
  };

  handlePinnedSampleChange = (_event: $TSFixMe, selectedSamples: $TSFixMe) => {
    const selectedSampleIds = new Set(
      selectedSamples.map((sample: $TSFixMe) =>
        sample.id ? sample.id : sample,
      ),
    );
    this.setState({ pendingPinnedSampleIds: selectedSampleIds });
  };

  handlePinnedSampleChangeApply = () => {
    const { pendingPinnedSampleIds } = this.state;
    this.setState({
      pinnedSampleIds: pendingPinnedSampleIds,
    });
  };

  handlePinnedSampleChangeCancel = () => {
    const { pinnedSampleIds } = this.state;
    this.setState({
      pendingPinnedSampleIds: pinnedSampleIds,
    });
  };

  handleUnpinSample = (sampleId: $TSFixMe) => {
    const { pinnedSampleIds } = this.state;
    pinnedSampleIds.delete(sampleId);
    this.setState({
      pinnedSampleIds,
      pendingPinnedSampleIds: pinnedSampleIds,
    });
  };

  handleSampleLabelClick = (sampleId: $TSFixMe) => {
    if (!sampleId) {
      this.setState({
        sidebarVisible: false,
      });
      return;
    }

    if (
      this.state.sidebarVisible &&
      this.state.sidebarMode === "sampleDetails" &&
      this.state.selectedSampleId === sampleId
    ) {
      this.setState({
        sidebarVisible: false,
      });
    } else {
      this.setState({
        selectedSampleId: sampleId,
        sidebarMode: "sampleDetails",
        sidebarVisible: true,
      });
    }
  };

  handleTaxonLabelClick = (taxonName: $TSFixMe) => {
    const taxonDetails = get(taxonName, this.state.allTaxonDetails);

    if (!taxonDetails) {
      this.setState({
        sidebarVisible: false,
      });
      return;
    }

    if (
      this.state.sidebarMode === "taxonDetails" &&
      this.state.sidebarVisible &&
      taxonName === get("taxonName", this.state.sidebarTaxonModeConfig)
    ) {
      this.setState({
        sidebarVisible: false,
      });
    } else {
      this.setState({
        sidebarMode: "taxonDetails",
        sidebarTaxonModeConfig: {
          parentTaxonId: taxonDetails.parentId,
          taxonId: taxonDetails.id,
          taxonName,
        },
        sidebarVisible: true,
      });
    }
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  getSidebarParams = () => {
    const {
      selectedSampleId,
      sidebarMode,
      sidebarTaxonModeConfig,
      selectedOptions,
    } = this.state;

    if (sidebarMode === "taxonDetails") {
      return sidebarTaxonModeConfig;
    }
    if (sidebarMode === "sampleDetails") {
      return {
        tempSelectedOptions: getTempSelectedOptions({
          selectedOptions,
          source: HEATMAP_SOURCE_TEMP_PERSISTED_OPTIONS,
        }),
        onMetadataUpdate: this.handleMetadataUpdate,
        sampleId: selectedSampleId,
        showReportLink: true,
      };
    }
    return {};
  };

  getControlOptions = (): OptionsType => ({
    // Server side options
    metrics: this.props.metrics?.filter(metric =>
      METRIC_OPTIONS.includes(metric.value),
    ),
    categories: this.props.categories || [],
    subcategories: this.props.subcategories || {},
    backgrounds: this.props.backgrounds,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    taxonLevels: this.props.taxonLevels.map((taxonLevelName, index) => ({
      text: taxonLevelName,
      value: index,
    })),
    thresholdFilters: this.props.thresholdFilters,
    // Client side options
    scales: SCALE_OPTIONS,
    sampleSortTypeOptions: SORT_SAMPLES_OPTIONS,
    taxaSortTypeOptions: SORT_TAXA_OPTIONS,
    taxonsPerSample: TAXONS_PER_SAMPLE_RANGE,
    specificityOptions: SPECIFICITY_OPTIONS,
  });

  handleSelectedOptionsChange = (newOptions: $TSFixMe) => {
    const { selectedOptions } = this.state;

    // don't refetch if options have not actually changed
    if (!newOptions) return;
    let haveOptionsChanged = false;

    if (newOptions.background === NONE_BACKGROUND.value) {
      newOptions.background = null;
      // remove Z score filters
      newOptions.thresholdFilters =
        this.state.selectedOptions.thresholdFilters?.filter(
          (threshold: ThresholdFilterData) => !metricIsZscore(threshold.metric),
        );
      // change metric to NT rpm if metric was Z score
      if (selectedOptions.metric && metricIsZscore(selectedOptions.metric)) {
        newOptions.metric = this.props.metrics?.[0]?.value;
      }
    }

    forEach(key => {
      const newValue = newOptions[key];
      const storedValue = selectedOptions[key];

      if (!isEqual(storedValue, newValue)) {
        haveOptionsChanged = true;
        return false; // break out of the loop, there's already a match
      }
    }, Object.keys(newOptions));

    if (!haveOptionsChanged) return;

    // When using heatmap ES (always true now), all filtering operations happen on the backend
    const backendFilters = ["background"].concat(HEATMAP_FILTERS);

    const shouldRefetchData =
      intersection(keys(newOptions), backendFilters).length > 0;

    let callbackFn: (() => Promise<void>) | null = null;

    if (shouldRefetchData) {
      callbackFn = async () => {
        // TODO: We can remove this notification once we pre-compute custom backgrounds or speed up Spark jobs
        if (newOptions?.background)
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
          this.showNotification(NOTIFICATION_TYPES.customBackground);
        await this.fetchViewData();
      };
    }

    this.setState(
      {
        selectedOptions: assign(this.state.selectedOptions, newOptions),
        loading: shouldRefetchData,
        // Don't re-notify the user if their manually selected taxa do not pass the new filters.
        notifiedFilteredOutTaxonIds: this.state.addedTaxonIds,
      },
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      callbackFn,
    );
  };

  updateBackground() {
    this.fetchBackground();
  }

  renderLoading() {
    const { sampleIds } = this.state;

    // This should only be for a split-second temporary state:
    if (!sampleIds) return null;

    const numSamples = sampleIds.length;
    return (
      <p className={cs.loadingIndicator}>
        <i className="fa fa-spinner fa-pulse fa-fw" />
        Loading for {numSamples} samples. Please expect to wait a few minutes.
      </p>
    );
  }

  renderHeatmap() {
    const {
      loadingFailed,
      selectedOptions: { background },
    } = this.state;

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'taxonIds' does not exist on type 'Readon... Remove this comment to see the full error message
    let shownTaxa = new Set(this.state.taxonIds, this.state.addedTaxonIds);
    shownTaxa = new Set(
      [...shownTaxa].filter(taxId => !this.removedTaxonIds.has(taxId)),
    );
    if (loadingFailed) {
      return (
        <SampleMessage
          icon={<IconAlert className={cs.iconAlert} type="error" />}
          link={CONTACT_US_LINK}
          linkText={"Contact us for help."}
          message={
            "Oh no! Something went wrong. Please try again or contact us for help."
          }
          status="error"
          type="error"
        />
      );
    } else if (
      this.state.loading ||
      !this.state.data ||
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
      !(this.state.data[this.state.selectedOptions.metric] || []).length ||
      !this.state.metadataTypes ||
      !this.state.taxonIds.length
    ) {
      return <div className={cs.noDataMsg}>No data to render</div>;
    }
    const scaleIndex = this.state.selectedOptions.dataScaleIdx;
    return (
      <ErrorBoundary>
        <SamplesHeatmapVis
          data={this.state.data}
          defaultMetadata={this.state.selectedMetadata}
          metadataTypes={this.state.metadataTypes}
          metadataSortField={this.metadataSortField}
          metadataSortAsc={this.metadataSortAsc}
          metric={this.state.selectedOptions.metric}
          onMetadataSortChange={this.handleMetadataSortChange}
          onMetadataChange={this.handleMetadataChange}
          onPinSample={this.handlePinnedSampleChange}
          onPinSampleApply={this.handlePinnedSampleChangeApply}
          onPinSampleCancel={this.handlePinnedSampleChangeCancel}
          onUnpinSample={this.handleUnpinSample}
          pendingPinnedSampleIds={Array.from(this.state.pendingPinnedSampleIds)}
          pinnedSampleIds={Array.from(this.state.pinnedSampleIds)}
          onAddTaxon={this.handleAddedTaxonChange}
          newTaxon={this.state.newestTaxonId}
          onRemoveTaxon={this.handleRemoveTaxon}
          onSampleLabelClick={this.handleSampleLabelClick}
          onTaxonLabelClick={this.handleTaxonLabelClick}
          options={this.getControlOptions()}
          loading={this.state.loading}
          ref={(vis: $TSFixMe) => {
            this.heatmapVis = vis;
          }}
          sampleIds={this.state.sampleIds}
          sampleDetails={this.state.sampleDetails}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
          scale={SCALE_OPTIONS[scaleIndex][1]}
          selectedTaxa={this.state.addedTaxonIds}
          selectedOptions={this.state.selectedOptions}
          // this.state.selectedOptions.species is 1 if species is selected, 0 otherwise.
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
          taxLevel={TAXON_LEVEL_SELECTED[this.state.selectedOptions.species]}
          tempSelectedOptions={getTempSelectedOptions({
            selectedOptions: this.state.selectedOptions,
            source: HEATMAP_SOURCE_TEMP_PERSISTED_OPTIONS,
          })}
          allTaxonIds={
            this.state.selectedOptions.species
              ? this.state.allSpeciesIds
              : this.state.allGeneraIds
          }
          taxonIds={Array.from(shownTaxa)}
          taxonCategories={this.state.selectedOptions.categories}
          taxonDetails={this.state.allTaxonDetails} // send allTaxonDetails in case of added taxa
          taxonFilterState={this.state.taxonFilterState}
          sampleSortType={this.state.selectedOptions.sampleSortType}
          fullScreen={this.state.hideFilters}
          taxaSortType={this.state.selectedOptions.taxaSortType}
          // appliedFilters and background are for the heatmap image caption
          appliedFilters={this.getAppliedFilters()}
          backgroundName={
            background
              ? find({ value: background }, this.props.backgrounds)?.name
              : NONE_BACKGROUND.name
          }
        />
      </ErrorBoundary>
    );
  }

  toggleDisplayFilters = () => {
    this.setState(prevState => ({ hideFilters: !prevState.hideFilters }));
  };

  renderInvalidSamplesWarning(onClose: $TSFixMe) {
    const { invalidSampleNames } = this.state;

    const header = (
      <div>
        <span className={cs.highlight}>
          {invalidSampleNames.length} sample
          {invalidSampleNames.length > 1 ? "s" : ""} won&apos;t be included in
          the heatmap
        </span>
        , because they either failed or are still processing:
      </div>
    );

    const content = (
      <span>
        {invalidSampleNames.map((name: $TSFixMe, index: $TSFixMe) => {
          return (
            <div key={index} className={cs.messageLine}>
              {name}
            </div>
          );
        })}
      </span>
    );

    return (
      <AccordionNotification
        header={header}
        content={content}
        open={false}
        type={"warning"}
        displayStyle={"elevated"}
        onClose={onClose}
      />
    );
  }

  renderFilteredOutWarning(onClose: () => void, taxon: $TSFixMe) {
    return (
      <Notification intent="warning" onClose={onClose} slideDirection="right">
        <div>
          <span className={cs.highlight}>
            {taxon.name} is filtered out by your current filter settings.
          </span>{" "}
          Remove some filters to see it appear.
        </div>
      </Notification>
    );
  }

  renderFilteredMultiplePipelineVersionsWarning(
    onClose: () => void,
    versions: string[],
  ) {
    return (
      <Notification intent="warning" onClose={onClose} slideDirection="right">
        <div>
          <span className={cs.highlight}>
            The selected samples come from multiple major pipeline versions:{" "}
            {versions.join(", ")}.
          </span>{" "}
          A major change in the pipeline may produce results that are not
          comparable across all metrics. We recommend re-running samples on the
          latest major pipeline version.
        </div>
      </Notification>
    );
  }

  renderCustomBackgroundWarning(onClose: () => void) {
    return (
      <Notification intent="warning" onClose={onClose} slideDirection="right">
        <div>
          We&apos;re busy generating your heatmap with a new background model.
          It may take a couple of minutes to load.
        </div>
      </Notification>
    );
  }

  showNotification(notification: string, params: $TSFixMe) {
    switch (notification) {
      case NOTIFICATION_TYPES.invalidSamples:
        showToast(
          ({ closeToast }: { closeToast(): void }) =>
            this.renderInvalidSamplesWarning(closeToast),
          {
            autoClose: 12000,
          },
        );
        break;
      case NOTIFICATION_TYPES.taxaFilteredOut:
        showToast(
          ({ closeToast }: { closeToast(): void }) =>
            this.renderFilteredOutWarning(closeToast, params),
          {
            autoClose: 12000,
          },
        );
        break;
      case NOTIFICATION_TYPES.multiplePipelineVersions:
        showToast(
          ({ closeToast }: { closeToast(): void }) =>
            this.renderFilteredMultiplePipelineVersionsWarning(
              closeToast,
              params,
            ),
          {
            autoClose: 12000,
          },
        );
        break;
      case NOTIFICATION_TYPES.multipleIndexVersions:
        showToast(
          ({ closeToast }: { closeToast(): void }) => {
            return (
              <Notification
                intent="warning"
                onClose={closeToast}
                slideDirection="right"
              >
                <div>
                  <span className={cs.highlight}>
                    The selected samples were run on different versions of our
                    NCBI index: {params.join(", ")}.
                  </span>{" "}
                  Changes across indices may produce results that are not
                  comparable. We recommend choosing samples and a background
                  model with the same NCBI index date.
                </div>
              </Notification>
            );
          },
          {
            autoClose: 12000,
          },
        );
        break;
      case NOTIFICATION_TYPES.backgroundDifferentIndexVersion:
        showToast(
          ({ closeToast }: { closeToast(): void }) => (
            <Notification
              intent="warning"
              onClose={closeToast}
              slideDirection="right"
            >
              <div>
                The background model you selected contains sample(s) run against
                a different version of our NCBI index than sample(s) in this
                heatmap.
              </div>
            </Notification>
          ),
          {
            autoClose: 12000,
          },
        );
        break;
      case NOTIFICATION_TYPES.customBackground:
        showToast(
          ({ closeToast }: { closeToast(): void }) =>
            this.renderCustomBackgroundWarning(closeToast),
          {
            autoClose: 12000,
          },
        );
        break;
      default:
        break;
    }
  }

  render() {
    const {
      addedTaxonIds,
      downloadModalOpen,
      hideFilters,
      loading,
      sampleIds,
      selectedOptions,
      sidebarMode,
      sidebarVisible,
      taxonIds,
    } = this.state;

    const unfilteredTaxa = [...taxonIds, ...addedTaxonIds];
    const shownTaxa = new Set(
      [...unfilteredTaxa].filter(taxId => !this.removedTaxonIds.has(taxId)),
    );

    return (
      <div className={cs.heatmap}>
        {/* render header */}
        <SamplesHeatmapHeader
          sampleIds={sampleIds}
          heatmapId={
            this.props.savedParamValues && this.props.savedParamValues.id
          }
          loading={loading}
          heatmapName={this.props.name}
          presets={this.state.selectedOptions["presets"]}
          onDownloadClick={this.handleDownloadModalOpen}
          onNewPresetsClick={this.handleHeatmapCreationModalOpen}
          onShareClick={this.handleShareClick}
          onSaveClick={this.handleSaveClick}
          onFilterToggleClick={this.toggleDisplayFilters}
          filterPanelOpen={!this.state.hideFilters}
          data={this.state.data}
          selectedOptions={selectedOptions}
          options={this.getControlOptions()}
        />
        {/* render visualization */}
        <div className="visualization-content">
          {/* render filters */}
          <div className={cs.filtersAndHeatmapContainer}>
            <div
              className={cx(
                cs.filterPanelContainer,
                hideFilters && cs.hideFilterPanel,
              )}
            >
              <FilterPanel
                hideFilters={hideFilters}
                content={
                  <SamplesHeatmapFilters
                    options={this.getControlOptions()}
                    selectedOptions={selectedOptions}
                    onSelectedOptionsChange={this.handleSelectedOptionsChange}
                    loading={loading}
                    data={this.state.data}
                    filteredTaxaCount={shownTaxa.size}
                    totalTaxaCount={
                      selectedOptions.species
                        ? this.state.allSpeciesIds.length
                        : this.state.allGeneraIds.length
                    }
                    prefilterConstants={this.props.prefilterConstants}
                    enableMassNormalizedBackgrounds={
                      this.state.enableMassNormalizedBackgrounds
                    }
                  />
                }
                anchorPosition={"left"}
                customDrawerWidth={200}
              />
            </div>
            {this.state.loading ? this.renderLoading() : this.renderHeatmap()}
          </div>
        </div>

        <DetailsSidebar
          visible={sidebarVisible}
          mode={sidebarMode}
          onClose={this.closeSidebar}
          params={this.getSidebarParams()}
        />
        {downloadModalOpen && (
          <SamplesHeatmapDownloadModal
            open
            onClose={this.handleDownloadModalClose}
            onGenerateBulkDownload={this.handleGenerateBulkDownload}
            sampleIds={sampleIds}
            heatmapParams={selectedOptions}
            onDownloadSvg={this.handleDownloadSvg}
            onDownloadPng={this.handleDownloadPng}
            onDownloadCurrentHeatmapViewCsv={
              this.getDownloadCurrentViewHeatmapCSVLink
            }
            onDownloadAllHeatmapMetricsCsv={this.handleDownloadCsv}
          />
        )}
      </div>
    );
  }
}

// Using a function component wrapper provides a semi-hacky way to
// access useContext without the class component to function component
// conversion.
const SamplesHeatmapView = (props: SamplesHeatmapViewProps) => {
  const allowedFeatures = useAllowedFeatures();
  const trackEvent = useTrackEvent();
  const withAnalytics = useWithAnalytics();

  const globalContext = useContext(GlobalContext);
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
  const dispatch = globalContext.globalContextDispatch;

  const updateDiscoveryProjectId = (projectIds: number[] | null) => {
    dispatch(createAction(ActionType.UPDATE_DISCOVERY_PROJECT_IDS, projectIds));
  };

  return (
    <SamplesHeatmapViewCC
      {...props}
      allowedFeatures={allowedFeatures}
      trackEvent={trackEvent}
      withAnalytics={withAnalytics}
      updateDiscoveryProjectIds={updateDiscoveryProjectId}
    />
  );
};

export default SamplesHeatmapView;
