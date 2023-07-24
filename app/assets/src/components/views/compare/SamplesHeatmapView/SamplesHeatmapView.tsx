import { Notification } from "@czi-sds/components";
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
  set,
  size,
  uniq,
} from "lodash/fp";
import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import {
  getPathogenFlags,
  getSampleTaxons,
  getTaxaDetails,
  saveVisualization,
} from "~/api";
import { validateSampleIds } from "~/api/access_control";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { getSampleMetadataFields } from "~/api/metadata";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { UserContext } from "~/components/common/UserContext";
import ErrorBoundary from "~/components/ErrorBoundary";
import FilterPanel from "~/components/layout/FilterPanel";
import ArrayUtils from "~/components/utils/ArrayUtils";
import { createCSVObjectURL, sanitizeCSVRow } from "~/components/utils/csv";
import { MAIL_TO_HELP_LINK } from "~/components/utils/documentationLinks";
import {
  HEATMAP_ELASTICSEARCH_FEATURE,
  HEATMAP_PATHOGEN_FLAGGING_FEATURE,
} from "~/components/utils/features";
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
import { WORKFLOWS } from "~/components/utils/workflows";
import HeatmapCreationModal from "~/components/views/compare/HeatmapCreationModal";
import SamplesHeatmapVis from "~/components/views/compare/SamplesHeatmapVis";
import { SampleMessage } from "~/components/views/components/SampleMessage";
import { URL_FIELDS } from "~/components/views/SampleView/constants";
import { copyShortUrlToClipboard } from "~/helpers/url";
import { SelectedOptions, Subcategories } from "~/interface/shared";
import { updateProjectIds } from "~/redux/modules/discovery/slice";
import { IconAlert } from "~ui/icons";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import { processMetadata } from "~utils/metadata";
import { showBulkDownloadNotification } from "../../bulk_download/BulkDownloadNotification";
import { SamplesHeatmapDownloadModal } from "./components/SamplesHeatmapDownloadModal/SamplesHeatmapDownloadModal";
import SamplesHeatmapFilters from "./components/SamplesHeatmapFilters";
import { OptionsType } from "./components/SamplesHeatmapFilters/SamplesHeatmapFilters";
import { SamplesHeatmapHeader } from "./components/SamplesHeatmapHeader/SamplesHeatmapHeader";
import SamplesHeatmapLegend from "./components/SamplesHeatmapLegend";
import {
  BACKGROUND_METRICS,
  HEATMAP_FILTERS,
  METRIC_OPTIONS,
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

const parseAndCheckInt = (val: $TSFixMe, defaultVal: $TSFixMe) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

interface SamplesHeatmapViewProps {
  addedTaxonIds?: $TSFixMeUnknown[];
  backgrounds?: { name?: string; value?: number }[];
  categories?: string[];
  heatmapTs?: number;
  metrics?: { value: string }[];
  name?: string;
  prefilterConstants?: { topN: unknown; minReads: unknown };
  removedTaxonIds?: $TSFixMeUnknown[];
  projectIds?: $TSFixMeUnknown[];
  sampleIds?: $TSFixMeUnknown[];
  sampleIdsToProjectIds?: $TSFixMeUnknown[];
  savedParamValues?: { id?: string | number };
  subcategories?: Subcategories;
  taxonLevels?: string[];
  thresholdFilters?: object;
  updateDiscoveryProjectIds?: $TSFixMeFunction;
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
  includePathogens?: boolean;
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

class SamplesHeatmapView extends React.Component<
  SamplesHeatmapViewProps,
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
  constructor(props: SamplesHeatmapViewProps) {
    super(props);

    this.urlParser = new UrlQueryParser(URL_FIELDS);
    this.urlParams = this.parseUrlParams();
    // URL params have precedence
    this.urlParams = {
      ...this.parseSavedParams(),
      ...this.urlParams,
    };

    this.initOnBeforeUnload(props.savedParamValues);
    // IMPORTANT NOTE: These default values should be kept in sync with the
    // backend defaults in HeatmapHelper for sanity.
    this.state = {
      selectedOptions: {
        metric: this.getSelectedMetric(),
        categories: this.urlParams.categories || [],
        subcategories: this.urlParams.subcategories || {},
        background: parseAndCheckInt(
          this.urlParams.background,
          this.props.backgrounds[0].value,
        ),
        species: parseAndCheckInt(this.urlParams.species, 1),
        sampleSortType: this.urlParams.sampleSortType || "cluster",
        taxaSortType: this.urlParams.taxaSortType || "cluster",
        thresholdFilters: this.urlParams.thresholdFilters || [],
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
      includePathogens: false, // this will be togglable by the user in the future
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
  getSelectedMetric() {
    if (this.props.metrics.map(m => m.value).includes(this.urlParams.metric)) {
      return this.urlParams.metric;
    } else {
      return (this.props.metrics[0] || {}).value;
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

    // temporarily set includePathogens to true for all users with the
    // heatmap_pathogens feature flag. Later this will be togglable by the user.
    const { allowedFeatures = [] } = this.context || {};
    const usePathogenFlagging = allowedFeatures.includes(
      HEATMAP_PATHOGEN_FLAGGING_FEATURE,
    );
    if (usePathogenFlagging) {
      this.setState({ includePathogens: true }, () => {
        this.fetchViewData();
        updateDiscoveryProjectIds(uniq(projectIds));
      });
    } else {
      this.fetchViewData();
      updateDiscoveryProjectIds(uniq(projectIds));
    }
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
        includePathogens: this.state.includePathogens,
      },
      this.state.selectedOptions,
    );
  };

  prepareParams = () => {
    const params = this.getUrlParams();

    // Parameters stored as objects
    // @ts-expect-error Type 'string' is not assignable to type 'any[]'.ts(2322)
    params.thresholdFilters = JSON.stringify(params.thresholdFilters);
    // @ts-expect-error Type 'string' is not assignable to type 'object'.ts(2322)
    params.subcategories = JSON.stringify(params.subcategories);
    return queryString.stringify(params, { arrayFormat: "bracket" });
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

    const selectedBackgroundName = find(
      { value: background },
      backgrounds,
    ).name;
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
    return [sanitizeCSVRow(filterRow).join()];
  };

  getDownloadCurrentViewHeatmapCSVLink = () => {
    const { selectedOptions } = this.state;
    let csvHeaders = [];
    let csvRows = [];
    const naExplanation =
      "NA: Not Applicable; sample did not meet thresholds set";

    if (!this.heatmapVis) {
      csvHeaders = ['"Current heatmap view did not render any data"'];
      csvRows = [['"Please try adjusting the filters or samples selected"']];
    } else {
      [csvHeaders, csvRows] =
        this.heatmapVis.computeCurrentHeatmapViewValuesForCSV({
          headers: compact(["Taxon", selectedOptions.species !== 0 && "Genus"]),
        });
    }

    csvRows.push(this.createCSVRowForSelectedOptions());
    csvRows.push([naExplanation]);
    return createCSVObjectURL(csvHeaders, csvRows);
  };

  handleDownloadCsv = () => {
    const url = new URL("/visualizations/download_heatmap", window.origin);
    const href = `${url.toString()}?${this.prepareParams()}`;
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
    // TODO (gdingle): pass in filename per sample?
    this.heatmapVis.download();
  };

  handleDownloadPng = () => {
    // TODO (gdingle): pass in filename per sample?
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
    const { allowedFeatures = [] } = this.context || {};
    const useHeatmapES = allowedFeatures.includes(
      HEATMAP_ELASTICSEARCH_FEATURE,
    );

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

    if (useHeatmapES) {
      fetchHeatmapDataParams.addedTaxonIds = Array.from(
        this.state.addedTaxonIds,
      );
    }

    const heatmapData = await getSampleTaxons(
      fetchHeatmapDataParams,
      this.lastRequestToken.token,
    );
    const fetchDataEnd = new Date();
    // @ts-expect-error ts-migrate(2362) FIXME: The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
    const loadTimeInMilliseconds = fetchDataEnd - fetchDataStart;

    trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED,
      {
        ...fetchHeatmapDataParams,
        loadTimeInMilliseconds,
        useHeatmapES,
      },
    );
    return heatmapData;
  }

  fetchMetadataFieldsBySampleIds(sampleIds: $TSFixMe) {
    if (this.state.metadataTypes) return null;
    return getSampleMetadataFields(sampleIds);
  }

  async fetchViewData() {
    const { allowedFeatures = [] } = this.context || {};
    const useHeatmapPathogensFeature = allowedFeatures.includes(
      HEATMAP_PATHOGEN_FLAGGING_FEATURE,
    );
    const { sampleIds } = this.state;

    this.setState({ loading: true }); // Gets false from this.updateFilters

    const { validIds, invalidSampleNames } = await validateSampleIds({
      sampleIds,
      workflow: WORKFLOWS.SHORT_READ_MNGS.value,
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
    let pathogenFlags: PathogenFlags;
    try {
      [heatmapData, metadataFields] = await Promise.all([
        this.fetchHeatmapData(validIds),
        this.fetchMetadataFieldsBySampleIds(validIds),
      ]);
      // request pathogenFlags after heatmapData to ensure that all data required
      // for the heatmap is already is ES for the pathogenFlags computation to use
      pathogenFlags = useHeatmapPathogensFeature
        ? await getPathogenFlags({
            sampleIds: validIds,
            background: this.state.selectedOptions.background,
          })
        : Promise.resolve({});
    } catch (err) {
      this.handleLoadingFailure(err);
      return; // Return early so that loadingFailed is not set to false later
    }

    let pipelineVersions = [];
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
    pipelineVersions = compact(property("pipeline_version"), heatmapData);
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

    this.setState({ pathogenFlags }, () => {
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
      this.setState(newState, this.updateFilters);
    });
  }

  handleLoadingFailure = (err: $TSFixMe) => {
    const { allTaxonIds, sampleIds } = this.state;
    const { allowedFeatures = [] } = this.context || {};
    const useHeatmapES = allowedFeatures.includes(
      HEATMAP_ELASTICSEARCH_FEATURE,
    );

    this.setState({
      loading: false,
      loadingFailed: true,
    });

    const logSingleError = (e: $TSFixMe) => {
      const errorMessage = `SamplesHeatmapView: Error loading heatmap data${
        useHeatmapES ? " from ElasticSearch" : ""
      }`;
      logError({
        message: errorMessage,
        details: {
          err: e,
          href: window.location.href,
          message: e?.message ?? errorMessage,
          sampleIds,
          status: e?.status,
          statusText: e?.statusText,
          usesElasticSearch: useHeatmapES,
        },
      });
    };

    if (Array.isArray(err)) {
      err.forEach(e => logSingleError(e));
    } else {
      logSingleError(err);
    }

    trackEvent(ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIEW_LOADING_ERROR, {
      numSamples: size(sampleIds),
      numTaxons: size(allTaxonIds),
      sampleIds,
      useHeatmapES,
    });
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
            allTaxonIds.push(taxon.tax_id);

            if (taxon.tax_level === TAXON_LEVEL_OPTIONS["species"]) {
              allSpeciesIds.push(taxon.tax_id);
            } else {
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
    this.setState({ loading: true }); // Gets false from this.updateFilters
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
    this.setState(newState, this.updateFilters);
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

          BACKGROUND_METRICS.forEach((metric: $TSFixMe) => {
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
    let { newestTaxonId, allTaxonDetails } = this.state;
    let taxonIds = new Set();
    let filteredData = {};
    const addedTaxonIdsPassingFilters = new Set();

    allTaxonIds.forEach((taxonId: $TSFixMe) => {
      const taxon = allTaxonDetails[taxonId];
      if (
        !taxonIds.has(taxonId) &&
        this.taxonPassesSelectedFilters(taxon) &&
        taxonPassesThresholdFilters[taxon["index"]]
      ) {
        taxonIds.add(taxon["id"]);
        if (addedTaxonIds.has(taxon["id"])) {
          addedTaxonIdsPassingFilters.add(taxon["id"]);
        }
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
    [taxonIds, allTaxonDetails, filteredData] = this.getTopTaxaPerSample(
      taxonIds,
      addedTaxonIdsPassingFilters,
    );
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
        metrics.forEach(metric => {
          filteredData[metric.value] = filteredData[metric.value] || [];
          filteredData[metric.value].push(
            allData[metric.value][taxon["index"]],
          );
        });

        // rebuild the filteredPathogenFlagData as well
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
    if (categories.length) {
      if (!phageSelected && taxonDetails["phage"]) {
        return false;
      }
      if (
        // Consider using the regular array includes function,
        // once we guarantee that all data is lower case
        !ArrayUtils.caseInsensitiveIncludes(
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

  getTopTaxaPerSample(filteredTaxonIds: $TSFixMe, addedTaxonIds: $TSFixMe) {
    const { allowedFeatures = [] } = this.context || {};
    const useHeatmapES = allowedFeatures.includes(
      HEATMAP_ELASTICSEARCH_FEATURE,
    );

    // Fetch the top N taxa from each sample, sorted by the selected metric,
    // that passed all selected filters.
    const { sampleDetails, allData, allTaxonDetails, selectedOptions } =
      this.state;
    const { metric, taxonsPerSample } = selectedOptions;
    const { metrics } = this.props;

    if (useHeatmapES) return [filteredTaxonIds, allTaxonDetails, allData];

    const topTaxIds = new Set();
    const topTaxonDetails = {};
    const filteredData = {};
    Object.values(sampleDetails).forEach((sample: $TSFixMe) => {
      const filteredTaxaInSample = sample.taxa.filter((taxonId: $TSFixMe) => {
        return filteredTaxonIds.has(taxonId);
      });

      filteredTaxaInSample.sort(
        (taxId1: $TSFixMe, taxId2: $TSFixMe) =>
          allData[metric][allTaxonDetails[taxId2].index][sample.index] -
          allData[metric][allTaxonDetails[taxId1].index][sample.index],
      );

      let count = 0;
      for (const taxId of filteredTaxaInSample) {
        if (count >= taxonsPerSample) {
          break;
        } else if (!topTaxIds.has(taxId) && !this.removedTaxonIds.has(taxId)) {
          const taxon = allTaxonDetails[taxId];
          topTaxIds.add(taxId);
          topTaxonDetails[taxId] = allTaxonDetails[taxId];
          topTaxonDetails[taxon["name"]] = allTaxonDetails[taxId];

          metrics.forEach(metric => {
            filteredData[metric.value] = filteredData[metric.value] || [];
            filteredData[metric.value].push(
              allData[metric.value][taxon["index"]],
            );
          });
        }
        count++;
      }
    });

    // Make sure that taxa manually added by the user that pass filters
    // are included.
    addedTaxonIds.forEach((taxId: $TSFixMe) => {
      if (!topTaxIds.has(taxId)) {
        const taxon = allTaxonDetails[taxId];
        topTaxIds.add(taxId);
        topTaxonDetails[taxId] = allTaxonDetails[taxId];
        topTaxonDetails[taxon["name"]] = allTaxonDetails[taxId];

        metrics.forEach(metric => {
          filteredData[metric.value] = filteredData[metric.value] || [];
          filteredData[metric.value].push(
            allData[metric.value][taxon["index"]],
          );
        });
      }
    });

    return [topTaxIds, topTaxonDetails, filteredData];
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
    this.setState({ loading: true }); // Gets false from this.updateFilters

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
      const tempTaxonIndex = taxon.index;
      const taxonIndex = allTaxonIds.length;
      taxon.index = taxonIndex;

      allTaxonIds.push(taxonId);
      allTaxonDetails[taxon.id] = taxon;
      allTaxonDetails[taxon.name] = taxon;

      // eslint-disable-next-line
      Object.entries(sampleDetails).map(([sampleId, sample]) => {
        sample.taxa.concat(extractedData.sampleDetails[sampleId].taxa);
        const sampleIndex = sample.index;
        const tempSampleIndex = extractedData.sampleDetails[sampleId].index;

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
      this.updateFilters,
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
          this.updateFilters();
        }
      },
    );
    trackEvent("SamplesHeatmapView_taxon_added", {
      selected: currentAddedTaxa,
    });
    this.updateHistoryState();
  };

  handleRemoveTaxon = (taxonName: $TSFixMe) => {
    const { addedTaxonIds } = this.state;
    const taxonId = this.state.allTaxonDetails[taxonName].id;
    this.removedTaxonIds.add(taxonId);

    trackEvent("SamplesHeatmapView_taxon_removed", {
      taxonId,
      taxonName,
    });

    // Only update state if something changed (slightly faster not to update state when not necessary)
    if (addedTaxonIds.has(taxonId)) {
      addedTaxonIds.delete(taxonId);
      this.setState({ addedTaxonIds }, this.updateFilters);
    } else {
      this.updateFilters();
    }
  };

  handleMetadataChange = (metadataFields: $TSFixMe) => {
    this.setState({
      selectedMetadata: Array.from(metadataFields),
    });
    trackEvent("SamplesHeatmapView_metadata_changed", {
      selected: metadataFields,
    });
    this.updateHistoryState();
  };

  handleMetadataSortChange = (field: $TSFixMe, dir: $TSFixMe) => {
    this.metadataSortField = field;
    this.metadataSortAsc = dir;
    this.updateHistoryState();
    trackEvent("Heatmap_column-metadata-label_clicked", {
      columnMetadataSortField: field,
      sortDirection: dir ? "asc" : "desc",
    });
  };

  handlePinnedSampleChange = (_event: $TSFixMe, selectedSamples: $TSFixMe) => {
    const selectedSampleIds = new Set(
      selectedSamples.map((sample: $TSFixMe) =>
        sample.id ? sample.id : sample,
      ),
    );
    this.setState({ pendingPinnedSampleIds: selectedSampleIds });
    trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_CHANGED,
      selectedSamples,
    );
  };

  handlePinnedSampleChangeApply = () => {
    const { pendingPinnedSampleIds } = this.state;
    this.setState({
      pinnedSampleIds: pendingPinnedSampleIds,
    });
    trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_APPLIED,
      pendingPinnedSampleIds,
    );
  };

  handlePinnedSampleChangeCancel = () => {
    const { pinnedSampleIds } = this.state;
    this.setState({
      pendingPinnedSampleIds: pinnedSampleIds,
    });
    trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_CANCELED,
      pinnedSampleIds,
    );
  };

  handleUnpinSample = (sampleId: $TSFixMe) => {
    const { pinnedSampleIds } = this.state;
    pinnedSampleIds.delete(sampleId);
    this.setState({
      pinnedSampleIds,
      pendingPinnedSampleIds: pinnedSampleIds,
    });
    trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIEW_SAMPLE_UNPIN_ICON_CLICKED,
      sampleId,
    );
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
      trackEvent("SamplesHeatmapView_sample-details-sidebar_closed", {
        sampleId: sampleId,
        sidebarMode: "sampleDetails",
      });
    } else {
      this.setState({
        selectedSampleId: sampleId,
        sidebarMode: "sampleDetails",
        sidebarVisible: true,
      });
      trackEvent("SamplesHeatmapView_sample-details-sidebar_opened", {
        sampleId: sampleId,
        sidebarMode: "sampleDetails",
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
      trackEvent("SamplesHeatmapView_taxon-details-sidebar_closed", {
        parentTaxonId: taxonDetails.parentId,
        taxonId: taxonDetails.id,
        taxonName,
        sidebarMode: "taxonDetails",
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
      trackEvent("SamplesHeatmapView_taxon-details-sidebar_opened", {
        parentTaxonId: taxonDetails.parentId,
        taxonId: taxonDetails.id,
        taxonName,
        sidebarMode: "taxonDetails",
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
    metrics: this.props.metrics.filter(metric =>
      METRIC_OPTIONS.includes(metric.value),
    ),
    categories: this.props.categories || [],
    subcategories: this.props.subcategories || {},
    backgrounds: this.props.backgrounds,
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
    const { allowedFeatures = [] } = this.context || {};
    const useHeatmapES = allowedFeatures.includes(
      HEATMAP_ELASTICSEARCH_FEATURE,
    );

    // don't refetch if options have not actually changed
    if (!newOptions) return;
    let haveOptionsChanged = false;

    forEach(key => {
      const newValue = newOptions[key];
      const storedValue = selectedOptions[key];

      if (!isEqual(storedValue, newValue)) {
        haveOptionsChanged = true;
        return false; // break out of the loop, there's already a match
      }
    }, Object.keys(newOptions));

    if (!haveOptionsChanged) return;

    // When using heatmap ES, all filtering operations happen on the backend
    let frontendFilters = [];
    let backendFilters = ["background"];
    if (useHeatmapES) backendFilters = backendFilters.concat(HEATMAP_FILTERS);
    else frontendFilters = HEATMAP_FILTERS;

    const shouldRefetchData =
      intersection(keys(newOptions), backendFilters).length > 0;
    const shouldRefilterData =
      intersection(keys(newOptions), frontendFilters).length > 0;

    // Infer which function to use to either fetch the data or filter it in the front-end
    let callbackFn = null;
    if (!useHeatmapES) {
      if (shouldRefetchData) callbackFn = this.updateBackground;
      else if (shouldRefilterData) callbackFn = this.updateFilters;
      // Slightly more verbose but should make it easier to remove the feature flag in the future
    } else {
      if (shouldRefetchData)
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
        loading: shouldRefilterData,
        // Don't re-notify the user if their manually selected taxa do not pass the new filters.
        notifiedFilteredOutTaxonIds: this.state.addedTaxonIds,
      },
      callbackFn,
    );
  };

  updateBackground() {
    this.fetchBackground();
  }

  updateFilters() {
    const { allowedFeatures = [] } = this.context || {};
    const useHeatmapES = allowedFeatures.includes(
      HEATMAP_ELASTICSEARCH_FEATURE,
    );
    if (useHeatmapES) {
      this.filterTaxaES();
    } else {
      this.filterTaxa();
    }
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
    const { loadingFailed } = this.state;

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'taxonIds' does not exist on type 'Readon... Remove this comment to see the full error message
    let shownTaxa = new Set(this.state.taxonIds, this.state.addedTaxonIds);
    shownTaxa = new Set(
      [...shownTaxa].filter(taxId => !this.removedTaxonIds.has(taxId)),
    );
    if (loadingFailed) {
      return (
        <SampleMessage
          icon={<IconAlert className={cs.iconAlert} type="error" />}
          link={MAIL_TO_HELP_LINK}
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
          pathogenFlagsData={this.state.pathogenFlagData}
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
          ref={(vis: $TSFixMe) => {
            this.heatmapVis = vis;
          }}
          sampleIds={this.state.sampleIds}
          sampleDetails={this.state.sampleDetails}
          scale={SCALE_OPTIONS[scaleIndex][1]}
          selectedTaxa={this.state.addedTaxonIds}
          selectedOptions={this.state.selectedOptions}
          // this.state.selectedOptions.species is 1 if species is selected, 0 otherwise.
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
            find(
              { value: this.state.selectedOptions.background },
              this.props.backgrounds,
            ).name
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

  renderFilteredOutWarning(onClose: $TSFixMe, taxon: $TSFixMe) {
    return (
      // @ts-expect-error Property 'dismissDirection' is missing in type
      <Notification intent="warning" onClose={onClose}>
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
    onClose: $TSFixMe,
    versions: $TSFixMe,
  ) {
    return (
      // @ts-expect-error Property 'dismissDirection' is missing in type
      <Notification intent="warning" onClose={onClose}>
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

  renderCustomBackgroundWarning(onClose: $TSFixMe) {
    return (
      // @ts-expect-error Property 'dismissDirection' is missing in type
      <Notification intent="warning" onClose={onClose}>
        <div>
          We&apos;re busy generating your heatmap with a new background model.
          It may take a couple of minutes to load.
        </div>
      </Notification>
    );
  }

  showNotification(notification: $TSFixMe, params: $TSFixMe) {
    switch (notification) {
      case NOTIFICATION_TYPES.invalidSamples:
        showToast(
          ({ closeToast }: $TSFixMe) =>
            this.renderInvalidSamplesWarning(closeToast),
          {
            autoClose: 12000,
          },
        );
        break;
      case NOTIFICATION_TYPES.taxaFilteredOut:
        showToast(
          ({ closeToast }: $TSFixMe) =>
            this.renderFilteredOutWarning(closeToast, params),
          {
            autoClose: 12000,
          },
        );
        break;
      case NOTIFICATION_TYPES.multiplePipelineVersions:
        showToast(
          ({ closeToast }: $TSFixMe) =>
            this.renderFilteredMultiplePipelineVersionsWarning(
              closeToast,
              params,
            ),
          {
            autoClose: 12000,
          },
        );
        break;
      case NOTIFICATION_TYPES.customBackground:
        showToast(
          ({ closeToast }: $TSFixMe) =>
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
      // allGeneraIds,
      // allSpeciesIds,
      // data,
      downloadModalOpen,
      // enableMassNormalizedBackgrounds,
      heatmapCreationModalOpen,
      // hideFilters,
      loading,
      sampleIds,
      selectedOptions,
      selectedSampleId,
      sidebarMode,
      sidebarVisible,
      taxonIds,
    } = this.state;

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 0-1 arguments, but got 2.
    let shownTaxa = new Set(taxonIds, addedTaxonIds);
    shownTaxa = new Set(
      [...shownTaxa].filter(taxId => !this.removedTaxonIds.has(taxId)),
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
        />
        {/* render visualization */}
        <div className="visualization-content">
          <SamplesHeatmapLegend
            loading={loading}
            data={this.state.data}
            selectedOptions={selectedOptions}
            options={this.getControlOptions()}
          />
          {/* render filters */}
          <div className={cs.filtersAndHeatmapContainer}>
            <FilterPanel
              hideFilters={this.state.hideFilters}
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
            {this.state.loading ? this.renderLoading() : this.renderHeatmap()}
          </div>
        </div>

        <DetailsSidebar
          visible={sidebarVisible}
          mode={sidebarMode}
          onClose={withAnalytics(
            this.closeSidebar,
            "SamplesHeatmapView_details-sidebar_closed",
            {
              sampleId: selectedSampleId,
              sidebarMode: sidebarMode,
            },
          )}
          params={this.getSidebarParams()}
        />
        {heatmapCreationModalOpen && (
          <HeatmapCreationModal
            continueInNewTab={true}
            open
            onClose={withAnalytics(
              this.handleHeatmapCreationModalClose,
              ANALYTICS_EVENT_NAMES.SAMPLES_VIEW_HEATMAP_CREATION_MODAL_CLOSED,
            )}
            selectedIds={sampleIds}
          />
        )}
        {downloadModalOpen && (
          <SamplesHeatmapDownloadModal
            open
            onClose={withAnalytics(
              this.handleDownloadModalClose,
              ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_DOWNLOAD_MODAL_CLOSED,
            )}
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

SamplesHeatmapView.contextType = UserContext;

const mapDispatchToProps = { updateDiscoveryProjectIds: updateProjectIds };

// Don't need mapStateToProps yet so pass in null
const connectedComponent = connect(
  null,
  mapDispatchToProps,
)(SamplesHeatmapView);
(connectedComponent.name as string) = "SamplesHeatmapView";

export default connectedComponent;
