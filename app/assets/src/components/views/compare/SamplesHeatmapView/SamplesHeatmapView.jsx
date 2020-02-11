import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import queryString from "query-string";
import {
  compact,
  map,
  difference,
  intersection,
  keys,
  assign,
  get,
  set,
  isEmpty,
  find,
} from "lodash/fp";
import DeepEqual from "fast-deep-equal";

import ErrorBoundary from "~/components/ErrorBoundary";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { NarrowContainer } from "~/components/layout";
import { copyShortUrlToClipboard } from "~/helpers/url";
import { processMetadata } from "~utils/metadata";
import { getSampleTaxons, saveVisualization } from "~/api";
import { getSampleMetadataFields } from "~/api/metadata";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import SamplesHeatmapVis from "~/components/views/compare/SamplesHeatmapVis";
import SortIcon from "~ui/icons/SortIcon";
import { UserContext } from "~/components/common/UserContext";

import cs from "./samples_heatmap_view.scss";
import SamplesHeatmapControls from "./SamplesHeatmapControls";
import SamplesHeatmapHeader from "./SamplesHeatmapHeader";

const SCALE_OPTIONS = [["Log", "symlog"], ["Lin", "linear"]];
const SORT_SAMPLES_OPTIONS = [
  { text: "Alphabetical", value: "alpha" },
  { text: "Cluster", value: "cluster" },
];
const SORT_TAXA_OPTIONS = [
  { text: "Genus", value: "genus" },
  { text: "Cluster", value: "cluster" },
];
const TAXONS_PER_SAMPLE_RANGE = {
  min: 1,
  max: 100,
};
const SPECIFICITY_OPTIONS = [
  { text: "All", value: 0 },
  { text: "Specific Only", value: 1 },
];
const METRIC_OPTIONS = [
  "NT.zscore",
  "NT.rpm",
  "NT.r",
  "NR.zscore",
  "NR.rpm",
  "NR.r",
];

const NCOV_PUBLIC_SITE = true;

const parseAndCheckInt = (val, defaultVal) => {
  let parsed = parseInt(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

class SamplesHeatmapView extends React.Component {
  constructor(props) {
    super(props);

    this.urlParams = this.parseUrlParams();
    // URL params have precedence
    this.urlParams = {
      ...this.parseSavedParams(),
      ...this.urlParams,
    };

    if (!NCOV_PUBLIC_SITE) {
      this.initOnBeforeUnload(props.savedParamValues);
    }

    // IMPORTANT NOTE: These default values should be kept in sync with the
    // backend defaults in HeatmapHelper for sanity.
    this.state = {
      selectedOptions: {
        metric: this.getSelectedMetric(),
        categories: this.urlParams.categories || [],
        subcategories: this.urlParams.subcategories || {},
        background: parseAndCheckInt(
          this.urlParams.background,
          this.props.backgrounds[0].value
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
      },
      loading: false,
      selectedMetadata: this.urlParams.selectedMetadata || [
        "collection_location_v2",
      ],
      sampleIds: compact(
        map(parseAndCheckInt, this.urlParams.sampleIds || this.props.sampleIds)
      ),
      sampleDetails: {},
      allTaxonIds: [],
      taxonIds: [],
      allTaxonDetails: {},
      taxonDetails: {},
      // allData is an object containing all the metric data for every taxa for each sample.
      // The key corresponds to the metric type (e.g. NT.rpm), and the value is 2D array;
      // rows correspond to taxa and columns correspond to samples.
      // Note that the 2D array is accesed by a taxon's/sample's INDEX, not id.
      allData: {},
      // data is an object containing metric data for only the samples that have passed filters
      // and are displayed on the heatmap. data is onlyl a subset of allData if client-side
      // filtering is enabled, otherwise they should be identical.
      data: {},
      hideFilters: false,
      // If we made the sidebar visibility depend on sampleId !== null,
      // there would be a visual flicker when sampleId is set to null as the sidebar closes.
      selectedSampleId: null,
      sidebarMode: null,
      sidebarVisible: false,
      sidebarTaxonModeConfig: null,
      taxonFilterState: [],
    };

    this.removedTaxonIds = new Set(
      this.urlParams.removedTaxonIds || this.props.removedTaxonIds || []
    );
    this.metadataSortField = this.urlParams.metadataSortField;
    this.metadataSortAsc = this.urlParams.metadataSortAsc;

    this.lastRequestToken = null;
  }

  // For converting legacy URLs
  getSelectedMetric() {
    if (this.props.metrics.map(m => m.value).includes(this.urlParams.metric)) {
      return this.urlParams.metric;
    } else {
      return (this.props.metrics[0] || {}).value;
    }
  }

  initOnBeforeUnload(savedParamValues) {
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
    this.fetchViewData();
  }

  parseUrlParams = () => {
    let urlParams = queryString.parse(location.search, {
      arrayFormat: "bracket",
    });
    // consider the cases where variables can be passed as array string
    if (typeof urlParams.sampleIds === "string") {
      urlParams.sampleIds = urlParams.sampleIds.split(",");
    }
    if (typeof urlParams.removedTaxonIds === "string") {
      urlParams.removedTaxonIds = new Set(
        urlParams.removedTaxonIds.split(",").map(parseInt)
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
              this.props.thresholdFilters.targets
            )
          ),
          ...threshold,
        }),
        JSON.parse(urlParams.thresholdFilters)
      );
    }
    if (typeof urlParams.selectedMetadata === "string") {
      urlParams.selectedMetadata = urlParams.selectedMetadata.split(",");
    }
    if (typeof urlParams.metadataSortAsc === "string") {
      urlParams.metadataSortAsc = urlParams.metadataSortAsc === "true";
    }
    return urlParams;
  };

  parseSavedParams = () => {
    // If the saved threshold object doesn't have metricDisplay, add it. For backwards compatibility.
    // See also parseUrlParams().
    // TODO: should remove this when the Visualization table is cleaned up.
    let savedParams = this.props.savedParamValues;
    if (savedParams && savedParams.thresholdFilters) {
      savedParams.thresholdFilters = map(
        threshold => ({
          metricDisplay: get(
            "text",
            find(
              ["value", threshold.metric],
              this.props.thresholdFilters.targets
            )
          ),
          ...threshold,
        }),
        savedParams.thresholdFilters
      );
      return savedParams;
    }
  };

  getUrlParams = () => {
    return Object.assign(
      {
        selectedMetadata: this.state.selectedMetadata,
        metadataSortField: this.metadataSortField,
        metadataSortAsc: this.metadataSortAsc,
        removedTaxonIds: Array.from(this.removedTaxonIds),
        sampleIds: this.state.sampleIds,
      },
      this.state.selectedOptions
    );
  };

  prepareParams = () => {
    let params = this.getUrlParams();

    // Parameters stored as objects
    params.thresholdFilters = JSON.stringify(params.thresholdFilters);
    params.subcategories = JSON.stringify(params.subcategories);
    return queryString.stringify(params, { arrayFormat: "bracket" });
  };

  getUrlForCurrentParams = () => {
    let url = new URL(location.pathname, window.origin);
    return `${url.toString()}?${this.prepareParams()}`;
  };

  handleDownloadCsv = () => {
    let url = new URL("/visualizations/download_heatmap", window.origin);
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

  metricToSortField(metric) {
    let fields = metric.split(".");
    let countType = fields[0].toLowerCase();
    let metricName = fields[1].toLowerCase();

    return "highest_" + countType + "_" + metricName;
  }

  fetchHeatmapData() {
    if (this.lastRequestToken)
      this.lastRequestToken.cancel("Parameters changed");
    this.lastRequestToken = axios.CancelToken.source();

    return getSampleTaxons(
      {
        sampleIds: this.state.sampleIds,
        removedTaxonIds: Array.from(this.removedTaxonIds),
        species: this.state.selectedOptions.species,
        categories: this.state.selectedOptions.categories,
        subcategories: this.state.selectedOptions.subcategories,
        sortBy: this.metricToSortField(this.state.selectedOptions.metric),
        thresholdFilters: this.state.selectedOptions.thresholdFilters,
        taxonsPerSample: this.state.selectedOptions.taxonsPerSample,
        readSpecificity: this.state.selectedOptions.readSpecificity,
        background: this.state.selectedOptions.background,
        heatmapTs: this.props.heatmapTs,
      },
      this.lastRequestToken.token
    );
  }

  fetchMetadataFieldsBySampleIds() {
    if (this.state.metadataTypes) return null;
    return getSampleMetadataFields(this.state.sampleIds);
  }

  async fetchViewData() {
    this.setState({ loading: true });

    let [heatmapData, metadataFields] = await Promise.all([
      this.fetchHeatmapData(),
      this.fetchMetadataFieldsBySampleIds(),
    ]);

    let newState = this.extractData(heatmapData);

    // Only calculate the metadataTypes once.
    if (metadataFields !== null) {
      newState.metadataTypes = metadataFields;
    }

    this.updateHistoryState();
    // this.state.loading will be set to false at the end of updateFilters
    this.setState(newState, this.updateFilters);
  }

  extractData(rawData) {
    let sampleIds = [];
    let sampleDetails = {};
    let allTaxonIds = [];
    let allTaxonDetails = {};
    let allData = {};
    let taxonFilterState = {};

    for (let i = 0; i < rawData.length; i++) {
      let sample = rawData[i];
      sampleIds.push(sample.sample_id);
      sampleDetails[sample.sample_id] = {
        id: sample.sample_id,
        name: sample.name,
        index: i,
        host_genome_name: sample.host_genome_name,
        metadata: processMetadata(sample.metadata, true),
        taxa: [],
      };
      if (sample.taxons) {
        for (let j = 0; j < sample.taxons.length; j++) {
          let taxon = sample.taxons[j];
          let taxonIndex;
          if (taxon.tax_id in allTaxonDetails) {
            taxonIndex = allTaxonDetails[taxon.tax_id].index;
          } else {
            taxonIndex = allTaxonIds.length;
            allTaxonIds.push(taxon.tax_id);
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
            };
            allTaxonDetails[taxon.name] = allTaxonDetails[taxon.tax_id];
          }

          sampleDetails[sample.sample_id].taxa.push(taxon.tax_id);

          this.props.metrics.forEach(metric => {
            let [metricType, metricName] = metric.value.split(".");
            allData[metric.value] = allData[metric.value] || [];
            allData[metric.value][taxonIndex] =
              allData[metric.value][taxonIndex] || [];
            allData[metric.value][taxonIndex][i] =
              taxon[metricType][metricName];
          });
        }
      }
    }

    return {
      // The server should always pass back the same set of sampleIds, but possibly in a different order.
      // We overwrite both this.state.sampleDetails and this.state.sampleIds to make sure the two are in sync.
      sampleIds,
      sampleDetails,
      allTaxonIds,
      allTaxonDetails,
      allData,
      taxonFilterState,
    };
  }

  filterTaxa() {
    const { allowedFeatures } = this.context || {};

    let {
      taxonFilterState,
      taxonPassesThresholdFilters,
    } = this.getTaxonThresholdFilterState();
    let { allTaxonIds, allTaxonDetails, allData } = this.state;
    let taxonDetails = {},
      taxonIds = new Set(),
      filteredData = {};
    if (allowedFeatures.includes("heatmap_filter_fe")) {
      allTaxonIds.forEach(taxonId => {
        let taxon = allTaxonDetails[taxonId];
        if (!taxonIds.has(taxonId) && this.taxonPassesSelectedFilters(taxon)) {
          if (taxonPassesThresholdFilters[taxon["index"]]) {
            taxonIds.add(taxon["id"]);
          }
        }
      });
      [taxonIds, taxonDetails, filteredData] = this.getTopTaxaPerSample(
        taxonIds
      );
      taxonIds = Array.from(taxonIds);
    } else {
      taxonDetails = allTaxonDetails;
      taxonIds = allTaxonIds;
      filteredData = allData;
    }

    this.updateHistoryState();

    this.setState({
      taxonFilterState: taxonFilterState,
      taxonDetails: taxonDetails,
      taxonIds: taxonIds,
      loading: false,
      data: filteredData,
    });
  }

  getTaxonThresholdFilterState() {
    // Set the state of whether or not a taxon passes the custom threshold filters
    // for each selected sample.
    let {
      sampleDetails,
      allTaxonDetails,
      allData,
      taxonFilterState,
    } = this.state;
    let taxonPassesThresholdFilters = {};
    Object.values(sampleDetails).forEach(sample => {
      Object.values(allTaxonDetails).forEach(taxon => {
        taxonFilterState[taxon["index"]] =
          taxonFilterState[taxon["index"]] || {};
        taxonFilterState[taxon["index"]][
          sample["index"]
        ] = this.taxonThresholdFiltersCheck(sample["index"], taxon, allData);

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

  taxonThresholdFiltersCheck(sampleIndex, taxonDetails, data) {
    let { thresholdFilters } = this.state.selectedOptions;
    for (let filter of thresholdFilters) {
      // Convert metric name format from "NT_zscore" to "NT.zscore"
      let metric = filter["metric"].split("_").join(".");
      if (Object.keys(data).includes(metric)) {
        let value = data[metric][taxonDetails["index"]][sampleIndex];
        if (!value) {
          return false;
        }
        if (filter["operator"] === ">=") {
          if (value < parseInt(filter["value"])) {
            return false;
          }
        } else if (filter["operator"] === "<=") {
          if (value > parseInt(filter["value"])) {
            return false;
          }
        }
      }
    }
    return true;
  }

  taxonPassesSelectedFilters(taxonDetails) {
    let {
      readSpecificity,
      categories,
      subcategories,
      species,
    } = this.state.selectedOptions;
    let phage_selected =
      subcategories["Viruses"] && subcategories["Viruses"].includes("Phage");

    if (species && taxonDetails["taxLevel"] !== 1) {
      return false;
    } else if (!species && taxonDetails["taxLevel"] !== 2) {
      return false;
    }
    if (readSpecificity && taxonDetails["id"] < 0) {
      return false;
    }
    if (categories.length) {
      if (!phage_selected && taxonDetails["phage"]) {
        return false;
      }
      if (
        !categories.includes(taxonDetails["category"]) &&
        !(phage_selected && taxonDetails["phage"])
      ) {
        return false;
      }
    } else if (phage_selected && !taxonDetails["phage"]) {
      // Exclude non-phages if only the phage subcategory is selected.
      return false;
    }
    return true;
  }

  getTopTaxaPerSample(filteredTaxonIds) {
    // Fetch the top N taxa from each sample, sorted by the selected metric,
    // that passed all selected filters.
    let {
      sampleDetails,
      allData,
      allTaxonDetails,
      selectedOptions,
    } = this.state;
    let { metric, taxonsPerSample } = selectedOptions;
    const { metrics } = this.props;

    let topTaxIds = new Set(),
      topTaxonDetails = {},
      filteredData = {};

    Object.values(sampleDetails).forEach(sample => {
      let filteredTaxaInSample = sample.taxa.filter(taxonId =>
        filteredTaxonIds.has(taxonId)
      );

      filteredTaxaInSample.sort(
        (taxId1, taxId2) =>
          allData[metric][allTaxonDetails[taxId2].index][sample.index] -
          allData[metric][allTaxonDetails[taxId1].index][sample.index]
      );

      let count = 0;
      for (let taxId of filteredTaxaInSample) {
        if (count >= taxonsPerSample) {
          break;
        } else if (!topTaxIds.has(taxId)) {
          let taxon = allTaxonDetails[taxId];
          topTaxIds.add(taxId);
          topTaxonDetails[taxId] = allTaxonDetails[taxId];
          topTaxonDetails[taxon["name"]] = allTaxonDetails[taxId];

          metrics.forEach(metric => {
            filteredData[metric.value] = filteredData[metric.value] || [];
            filteredData[metric.value].push(
              allData[metric.value][taxon["index"]]
            );
          });
          count++;
        }
      }
    });
    return [topTaxIds, topTaxonDetails, filteredData];
  }

  handleMetadataUpdate = (key, value) => {
    this.setState({
      sampleDetails: set(
        [this.state.selectedSampleId, "metadata", key],
        value,
        this.state.sampleDetails
      ),
    });
  };

  updateHistoryState = () => {
    window.history.replaceState("", "", this.getUrlForCurrentParams());
  };

  handleRemoveTaxon = taxonName => {
    let taxonId = this.state.taxonDetails[taxonName].id;
    this.removedTaxonIds.add(taxonId);
    logAnalyticsEvent("SamplesHeatmapView_taxon_removed", {
      taxonId,
      taxonName,
    });
  };

  handleMetadataChange = metadataFields => {
    this.setState({
      selectedMetadata: Array.from(metadataFields),
    });
    logAnalyticsEvent("SamplesHeatmapView_metadata_changed", {
      selected: metadataFields,
    });
    this.updateHistoryState();
  };

  handleMetadataSortChange = (field, dir) => {
    this.metadataSortField = field;
    this.metadataSortAsc = dir;
    this.updateHistoryState();
    logAnalyticsEvent("Heatmap_column-metadata-label_clicked", {
      columnMetadataSortField: field,
      sortDirection: dir ? "asc" : "desc",
    });
  };

  handleSampleLabelClick = sampleId => {
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
      logAnalyticsEvent("SamplesHeatmapView_sample-details-sidebar_closed", {
        sampleId: sampleId,
        sidebarMode: "sampleDetails",
      });
    } else {
      this.setState({
        selectedSampleId: sampleId,
        sidebarMode: "sampleDetails",
        sidebarVisible: true,
      });
      logAnalyticsEvent("SamplesHeatmapView_sample-details-sidebar_opened", {
        sampleId: sampleId,
        sidebarMode: "sampleDetails",
      });
    }
  };

  handleTaxonLabelClick = taxonName => {
    const taxonDetails = get(taxonName, this.state.taxonDetails);

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
      logAnalyticsEvent("SamplesHeatmapView_taxon-details-sidebar_closed", {
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
      logAnalyticsEvent("SamplesHeatmapView_taxon-details-sidebar_opened", {
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
    if (this.state.sidebarMode === "taxonDetails") {
      return this.state.sidebarTaxonModeConfig;
    }
    if (this.state.sidebarMode === "sampleDetails") {
      return {
        sampleId: this.state.selectedSampleId,
        onMetadataUpdate: this.handleMetadataUpdate,
        showReportLink: true,
      };
    }
    return {};
  };

  getControlOptions = () => ({
    // Server side options
    metrics: this.props.metrics.filter(metric =>
      METRIC_OPTIONS.includes(metric.value)
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

  handleSelectedOptionsChange = newOptions => {
    const { allowedFeatures } = this.context || {};

    if (allowedFeatures.includes("heatmap_filter_fe")) {
      const frontendFilters = [
        "species",
        "categories",
        "subcategories",
        "thresholdFilters",
        "readSpecificity",
        "metric",
        "taxonsPerSample",
      ];
      const backendFilters = ["background"];
      const shouldRefetchData =
        intersection(keys(newOptions), backendFilters).length > 0;
      const shouldRefilterData =
        intersection(keys(newOptions), frontendFilters).length > 0;
      this.setState(
        {
          selectedOptions: assign(this.state.selectedOptions, newOptions),
          loading: shouldRefilterData,
        },
        shouldRefetchData
          ? this.updateHeatmap
          : shouldRefilterData
            ? this.updateFilters
            : null
      );
    } else {
      const excluding = ["dataScaleIdx", "sampleSortType", "taxaSortType"];
      const shouldRefetchData = difference(keys(newOptions), excluding).length;
      this.setState(
        {
          selectedOptions: assign(this.state.selectedOptions, newOptions),
        },
        shouldRefetchData ? this.updateHeatmap : null
      );
    }
  };

  updateHeatmap() {
    this.fetchViewData();
  }

  updateFilters() {
    this.filterTaxa();
  }

  renderVisualization() {
    return (
      <div className="visualization-content">
        {this.state.loading ? this.renderLoading() : this.renderHeatmap()}
      </div>
    );
  }

  renderLoading() {
    const numSamples = this.state.sampleIds.length;
    // This was determined empirically by varying the number of samples from 4
    // to 55 in prod. The time increased linearly close to a factor of 0.5.
    const estimate = Math.round(numSamples / 2);
    return (
      <p className={cs.loadingIndicator}>
        <i className="fa fa-spinner fa-pulse fa-fw" />
        Loading for {numSamples} samples. Please wait up to {estimate} second
        {estimate > 1 ? "s" : ""}...
      </p>
    );
  }

  renderHeatmap() {
    if (
      this.state.loading ||
      !this.state.data ||
      !(this.state.data[this.state.selectedOptions.metric] || []).length ||
      !this.state.metadataTypes ||
      !this.state.taxonIds.length
    ) {
      return <div className={cs.noDataMsg}>No data to render</div>;
    }
    let scaleIndex = this.state.selectedOptions.dataScaleIdx;
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
          onRemoveTaxon={this.handleRemoveTaxon}
          onSampleLabelClick={this.handleSampleLabelClick}
          onTaxonLabelClick={this.handleTaxonLabelClick}
          ref={vis => {
            this.heatmapVis = vis;
          }}
          sampleIds={this.state.sampleIds}
          sampleDetails={this.state.sampleDetails}
          scale={SCALE_OPTIONS[scaleIndex][1]}
          taxonIds={this.state.taxonIds}
          taxonCategories={this.state.selectedOptions.categories}
          taxonDetails={this.state.taxonDetails}
          taxonFilterState={this.state.taxonFilterState}
          thresholdFilters={this.state.selectedOptions.thresholdFilters}
          sampleSortType={this.state.selectedOptions.sampleSortType}
          fullScreen={this.state.hideFilters}
          taxaSortType={this.state.selectedOptions.taxaSortType}
        />
      </ErrorBoundary>
    );
  }

  toggleDisplayFilters = () => {
    this.setState(prevState => ({ hideFilters: !prevState.hideFilters }));
  };

  render() {
    return (
      <div className={cs.heatmap}>
        {!this.state.hideFilters && (
          <div>
            <NarrowContainer>
              <SamplesHeatmapHeader
                sampleIds={this.state.sampleIds}
                data={this.state.data}
                onDownloadSvg={this.handleDownloadSvg}
                onDownloadPng={this.handleDownloadPng}
                onDownloadCsv={this.handleDownloadCsv}
                onShareClick={this.handleShareClick}
                onSaveClick={this.handleSaveClick}
              />
            </NarrowContainer>
            <NarrowContainer>
              <SamplesHeatmapControls
                options={this.getControlOptions()}
                selectedOptions={this.state.selectedOptions}
                onSelectedOptionsChange={this.handleSelectedOptionsChange}
                loading={this.state.loading}
                data={this.state.data}
              />
            </NarrowContainer>
          </div>
        )}
        <div className={cs.filterToggleContainer}>
          {this.state.hideFilters && <div className={cs.filterLine} />}
          <div
            className={cs.arrowIcon}
            onClick={withAnalytics(
              this.toggleDisplayFilters,
              "SamplesHeatmapFilters_toggle_clicked"
            )}
          >
            <SortIcon
              sortDirection={
                this.state.hideFilters ? "descending" : "ascending"
              }
            />
          </div>
        </div>
        {this.renderVisualization()}
        <DetailsSidebar
          visible={this.state.sidebarVisible}
          mode={this.state.sidebarMode}
          onClose={withAnalytics(
            this.closeSidebar,
            "SamplesHeatmapView_details-sidebar_closed",
            {
              sampleId: this.state.selectedSampleId,
              sidebarMode: this.state.sidebarMode,
            }
          )}
          params={this.getSidebarParams()}
        />
      </div>
    );
  }
}

SamplesHeatmapView.propTypes = {
  backgrounds: PropTypes.array,
  categories: PropTypes.array,
  metrics: PropTypes.array,
  sampleIds: PropTypes.array,
  savedParamValues: PropTypes.object,
  subcategories: PropTypes.object,
  removedTaxonIds: PropTypes.array,
  taxonLevels: PropTypes.array,
  thresholdFilters: PropTypes.object,
  heatmapTs: PropTypes.number,
};

SamplesHeatmapView.contextType = UserContext;

export default SamplesHeatmapView;
