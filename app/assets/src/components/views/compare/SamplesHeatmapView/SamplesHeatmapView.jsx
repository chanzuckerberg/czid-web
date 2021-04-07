import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import queryString from "query-string";
import { connect } from "react-redux";
import {
  assign,
  compact,
  difference,
  find,
  get,
  intersection,
  isEmpty,
  keys,
  map,
  omit,
  property,
  set,
  toLower,
  uniq,
  values,
} from "lodash/fp";
import DeepEqual from "fast-deep-equal";

import ErrorBoundary from "~/components/ErrorBoundary";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { NarrowContainer } from "~/components/layout";
import { copyShortUrlToClipboard } from "~/helpers/url";
import { processMetadata } from "~utils/metadata";
import { diff } from "~/components/utils/objectUtil";
import { logError } from "~/components/utils/logUtil";
import { sanitizeCSVRow, createCSVObjectURL } from "~/components/utils/csv";
import { getSampleTaxons, saveVisualization, getTaxaDetails } from "~/api";
import { getSampleMetadataFields } from "~/api/metadata";
import { updateProjectIds } from "~/redux/modules/discovery/slice";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import {
  isPipelineFeatureAvailable,
  MASS_NORMALIZED_FEATURE,
} from "~/components/utils/pipeline_versions";
import SamplesHeatmapVis from "~/components/views/compare/SamplesHeatmapVis";
import { SortIcon } from "~ui/icons";
import Notification from "~ui/notifications/Notification";
import AccordionNotification from "~ui/notifications/AccordionNotification";
import { showToast } from "~/components/utils/toast";
import { validateSampleIds } from "~/api/access_control";
import { UserContext } from "~/components/common/UserContext";
import { URL_FIELDS } from "~/components/views/SampleView/constants.js";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { WORKFLOWS } from "~/components/utils/workflows";
import {
  SCALE_OPTIONS,
  SORT_SAMPLES_OPTIONS,
  TAXON_LEVEL_OPTIONS,
  TAXON_LEVEL_SELECTED,
  SORT_TAXA_OPTIONS,
  TAXONS_PER_SAMPLE_RANGE,
  SPECIFICITY_OPTIONS,
  METRIC_OPTIONS,
  BACKGROUND_METRICS,
  NOTIFICATION_TYPES,
} from "./constants";
import cs from "./samples_heatmap_view.scss";
import SamplesHeatmapControls from "./SamplesHeatmapControls";
import SamplesHeatmapHeader from "./SamplesHeatmapHeader";
import ArrayUtils from "~/components/utils/ArrayUtils";

const parseAndCheckInt = (val, defaultVal) => {
  let parsed = parseInt(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

class SamplesHeatmapView extends React.Component {
  constructor(props) {
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
      invalidSampleNames: [],
      sampleDetails: {},
      allTaxonIds: [],
      allSpeciesIds: [],
      allGeneraIds: [],
      taxonIds: [],
      addedTaxonIds: new Set(
        this.urlParams.addedTaxonIds || this.props.addedTaxonIds || []
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
        this.urlParams.addedTaxonIds || this.props.addedTaxonIds || []
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
    const { projectIds, updateDiscoveryProjectIds } = this.props;

    this.fetchViewData();
    updateDiscoveryProjectIds(uniq(projectIds));
  }

  parseUrlParams = () => {
    let urlParams = queryString.parse(location.search, {
      arrayFormat: "bracket",
    });
    // consider the cases where variables can be passed as array string
    if (typeof urlParams.sampleIds === "string") {
      urlParams.sampleIds = urlParams.sampleIds.split(",");
    }
    if (typeof urlParams.addedTaxonIds === "string") {
      urlParams.addedTaxonIds = new Set(
        urlParams.addedTaxonIds.split(",").map(parseInt)
      );
    } else if (typeof urlParams.addedTaxonIds === "object") {
      urlParams.addedTaxonIds = new Set(
        urlParams.addedTaxonIds.map(id => parseInt(id))
      );
    }
    if (typeof urlParams.removedTaxonIds === "string") {
      urlParams.removedTaxonIds = new Set(
        urlParams.removedTaxonIds.split(",").map(parseInt)
      );
    } else if (typeof urlParams.removedTaxonIds === "object") {
      urlParams.removedTaxonIds = new Set(
        urlParams.removedTaxonIds.map(id => parseInt(id))
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
        addedTaxonIds: Array.from(this.state.addedTaxonIds),
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
        "metric",
      ],
      diff(selectedOptions, this.getDefaultSelectedOptions())
    );
  };

  createCSVRowForSelectedOptions = () => {
    const { backgrounds } = this.props;
    const { selectedOptions } = this.state;
    const { metric, background } = selectedOptions;

    const selectedBackgroundName = find({ value: background }, backgrounds)
      .name;
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
          const thresholdFilters = val.reduce((result, threshold) => {
            result.push(
              `${threshold["metricDisplay"]} ${threshold["operator"]} ${threshold["value"]}`
            );
            return result;
          }, []);

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
          let subcategories = [];
          for (const [subcategoryName, subcategoryVal] of Object.entries(val)) {
            if (!isEmpty(subcategoryVal)) {
              subcategories.push(
                `${subcategoryName} - ${subcategoryVal.join()}`
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
            }"`
          );
          ++numberOfFilters;
          break;
        }
        default: {
          logError({
            msg:
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

    if (!this.heatmapVis) {
      csvHeaders = ['"Current heatmap view did not render any data"'];
      csvRows = [['"Please try adjusting the filters or samples selected"']];
    } else {
      [
        csvHeaders,
        csvRows,
      ] = this.heatmapVis.computeCurrentHeatmapViewValuesForCSV({
        headers: compact(["Taxon", selectedOptions.species !== 0 && "Genus"]),
      });
    }

    csvRows.push(this.createCSVRowForSelectedOptions());
    return createCSVObjectURL(csvHeaders, csvRows);
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
    // If using client-side filtering, the server should still return info
    // related to removed taxa in case the user decides to add the taxon back.
    const removedTaxonIds = [];

    if (this.lastRequestToken) {
      this.lastRequestToken.cancel("Parameters changed");
    }
    this.lastRequestToken = axios.CancelToken.source();
    return getSampleTaxons(
      {
        sampleIds: this.state.sampleIds,
        removedTaxonIds: removedTaxonIds,
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
    const { allowedFeatures = [] } = this.context || {};

    this.setState({ loading: true });

    const sampleValidationInfo = await validateSampleIds(
      this.state.sampleIds,
      WORKFLOWS.SHORT_READ_MNGS.value
    );

    this.setState({
      sampleIds: sampleValidationInfo.validSampleIds,
      invalidSampleNames: sampleValidationInfo.invalidSampleNames,
    });

    // If there are failed/waiting samples selected, display a warning
    // to the user that they won't appear in the heatmap.
    if (sampleValidationInfo.invalidSampleNames.length > 0) {
      this.showNotification(NOTIFICATION_TYPES.invalidSamples);
    }

    let [heatmapData, metadataFields] = await Promise.all([
      this.fetchHeatmapData(),
      this.fetchMetadataFieldsBySampleIds(),
    ]);

    let pipelineVersions = [];
    if (allowedFeatures.includes("heatmap_service")) {
      pipelineVersions = compact(
        map(
          property("pipeline_run.pipeline_version"),
          values(heatmapData.samples)
        )
      );
    } else {
      pipelineVersions = compact(property("pipeline_version"), heatmapData);
    }
    const pipelineMajorVersionsSet = new Set(
      map(
        pipelineVersion => `${pipelineVersion.split(".")[0]}.x`,
        pipelineVersions
      )
    );

    if (pipelineMajorVersionsSet.size > 1) {
      this.showNotification(NOTIFICATION_TYPES.multiplePipelineVersions, [
        ...pipelineMajorVersionsSet,
      ]);
    }

    const newState = allowedFeatures.includes("heatmap_service")
      ? this.extractDataFromService(heatmapData)
      : this.extractData(heatmapData);

    // Only calculate the metadataTypes once.
    if (metadataFields !== null) {
      newState.metadataTypes = metadataFields;
    }

    this.updateHistoryState();
    // this.state.loading will be set to false at the end of updateFilters
    this.setState(newState, this.updateFilters);
  }

  extractDataFromService(rawData) {
    const { metrics } = this.props;

    let sampleIds = [];
    let sampleNamesCounts = new Map();
    let sampleDetails = {};
    let allTaxonIds = [];
    let allSpeciesIds = [];
    let allGeneraIds = [];
    let allTaxonDetails = {};
    let allData = {};
    let taxonFilterState = {};
    // Check if all samples have ERCC counts > 0 to enable backgrounds generated
    // using normalized input mass.
    let enableMassNormalizedBackgrounds = true;

    for (let i = 0; i < rawData.samples.length; i++) {
      let sample = rawData.samples[i];

      sampleIds.push(sample.id);
      const pipelineRun = sample.pipeline_run;
      enableMassNormalizedBackgrounds =
        pipelineRun.ercc_count > 0 &&
        isPipelineFeatureAvailable(
          MASS_NORMALIZED_FEATURE,
          pipelineRun.pipeline_version
        ) &&
        enableMassNormalizedBackgrounds;

      // Keep track of samples with the same name, which may occur if
      // a user selects samples from multiple projects.
      if (sampleNamesCounts.has(sample.name)) {
        // Append a number to a sample's name to differentiate between samples with the same name.
        let count = sampleNamesCounts.get(sample.name);
        let originalName = sample.name;
        sample.name = `${sample.name} (${count})`;
        sampleNamesCounts.set(originalName, count + 1);
      } else {
        sampleNamesCounts.set(sample.name, 1);
      }

      sampleDetails[sample.id] = {
        id: sample.id,
        name: sample.name,
        index: i,
        host_genome_name: sample.host_genome_name,
        metadata: processMetadata(sample.metadata, true),
        taxa: [],
        duplicate: false,
      };
    }

    for (let i = 0; i < rawData.taxa.length; i++) {
      const taxonIndex = allTaxonIds.length;
      const taxon = rawData.taxa[i];
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
        parentId: taxon.genus_taxid,
        phage: !!taxon.is_phage,
        genusName: taxon.genus_name,
        taxLevel: taxon.tax_level,
        sampleCount: 0,
      };
      allTaxonDetails[taxon.name] = allTaxonDetails[taxon.tax_id];
    }

    const metricIndex = rawData.result_keys.reduce(
      (acc, current, idx) => ({ ...acc, [current]: idx }),
      {}
    );
    for (const [sampleId, countsPerTaxa] of Object.entries(rawData.results)) {
      for (const [taxId, countsPerType] of Object.entries(countsPerTaxa)) {
        allTaxonDetails[taxId].sampleCount += 1;
        sampleDetails[sampleId].taxa.push(parseInt(taxId));

        const taxonIndex = allTaxonDetails[taxId].index;
        const sampleIndex = sampleDetails[sampleId].index;

        metrics.forEach(metric => {
          let [metricType, metricName] = metric.value.split(".");
          allData[metric.value] = allData[metric.value] || [];
          allData[metric.value][taxonIndex] =
            allData[metric.value][taxonIndex] || [];
          if (countsPerType[metricType]) {
            const metricDatum =
              countsPerType[metricType][metricIndex[metricName]];
            allData[metric.value][taxonIndex][sampleIndex] = metricDatum;
          } else {
            allData[metric.value][taxonIndex][sampleIndex] = 0;
          }
        });
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
      taxonFilterState,
      enableMassNormalizedBackgrounds,
    };
  }

  extractData(rawData) {
    let sampleIds = [];
    let sampleNamesCounts = new Map();
    let sampleDetails = {};
    let allTaxonIds = [];
    let allSpeciesIds = [];
    let allGeneraIds = [];
    let allTaxonDetails = {};
    let allData = {};
    let taxonFilterState = {};
    // Check if all samples have ERCC counts > 0 to enable backgrounds generated
    // using normalized input mass.
    let enableMassNormalizedBackgrounds = true;

    for (let i = 0; i < rawData.length; i++) {
      let sample = rawData[i];
      sampleIds.push(sample.sample_id);

      enableMassNormalizedBackgrounds =
        sample.ercc_count > 0 &&
        isPipelineFeatureAvailable(
          MASS_NORMALIZED_FEATURE,
          sample.pipeline_version
        ) &&
        enableMassNormalizedBackgrounds;

      // Keep track of samples with the same name, which may occur if
      // a user selects samples from multiple projects.
      if (sampleNamesCounts.has(sample.name)) {
        // Append a number to a sample's name to differentiate between samples with the same name.
        let count = sampleNamesCounts.get(sample.name);
        let originalName = sample.name;
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
        metadata: processMetadata(sample.metadata, true),
        taxa: [],
        duplicate: false,
      };
      if (sample.taxons) {
        for (let j = 0; j < sample.taxons.length; j++) {
          let taxon = sample.taxons[j];
          let taxonIndex;
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
      allSpeciesIds,
      allGeneraIds,
      allTaxonDetails,
      allData,
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
    });
  }

  async fetchBackground() {
    const { allowedFeatures = [] } = this.context || {};

    this.setState({ loading: true });
    let backgroundData = await this.fetchBackgroundData();
    let newState = allowedFeatures.includes("heatmap_service")
      ? this.extractBackgroundMetricsFromService(backgroundData)
      : this.extractBackgroundMetrics(backgroundData);

    this.updateHistoryState();
    this.setState(newState, this.updateFilters);
  }

  extractBackgroundMetricsFromService(rawData, updateBackground) {
    let { sampleDetails, allTaxonDetails, allData } = this.state;
    const { metrics } = this.props;

    const metricIndex = rawData.result_keys.reduce(
      (acc, current, idx) => ({ ...acc, [current]: idx }),
      {}
    );
    for (const [sampleId, countsPerTaxa] of Object.entries(rawData.results)) {
      for (const [taxId, countsPerType] of Object.entries(countsPerTaxa)) {
        const taxonIndex = allTaxonDetails[taxId].index;
        const sampleIndex = sampleDetails[sampleId].index;

        metrics.forEach(metric => {
          let [metricType, metricName] = metric.value.split(".");
          if (countsPerType[metricType]) {
            const metricDatum =
              countsPerType[metricType][metricIndex[metricName]];
            allData[metric.value] = allData[metric.value] || [];
            allData[metric.value][taxonIndex] =
              allData[metric.value][taxonIndex] || [];
            allData[metric.value][taxonIndex][sampleIndex] = metricDatum;
          }
        });
      }
    }

    return { allData };
  }

  extractBackgroundMetrics(rawData) {
    let { sampleDetails, allTaxonDetails, allData } = this.state;

    // The server should always pass back the same set of samples and taxa,
    // but possibly in a different order, so we need to match them up to their
    // respective indices based on their ids.
    for (let i = 0; i < rawData.length; i++) {
      let sample = rawData[i];
      let sampleIndex = sampleDetails[sample.sample_id].index;

      for (let j = 0; j < sample.taxons.length; j++) {
        let taxon = sample.taxons[j];
        let taxonIndex = allTaxonDetails[taxon.tax_id].index;

        BACKGROUND_METRICS.forEach(metric => {
          let [metricType, metricName] = metric.value.split(".");
          allData[metric.value] = allData[metric.value] || [];
          allData[metric.value][taxonIndex] =
            allData[metric.value][taxonIndex] || [];
          allData[metric.value][taxonIndex][sampleIndex] =
            taxon[metricType][metricName];
        });
      }
    }

    return { allData };
  }

  filterTaxa() {
    let {
      taxonFilterState,
      taxonPassesThresholdFilters,
    } = this.getTaxonThresholdFilterState();
    let {
      allTaxonIds,
      allTaxonDetails,
      addedTaxonIds,
      notifiedFilteredOutTaxonIds,
      newestTaxonId,
    } = this.state;
    let taxonIds = new Set();
    let filteredData = {};
    let addedTaxonIdsPassingFilters = new Set();

    allTaxonIds.forEach(taxonId => {
      let taxon = allTaxonDetails[taxonId];
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
      addedTaxonIdsPassingFilters
    );
    taxonIds = Array.from(taxonIds);

    this.updateHistoryState();

    this.setState({
      taxonFilterState,
      taxonIds,
      loading: false,
      data: filteredData,
      notifiedFilteredOutTaxonIds,
      newestTaxonId,
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
          if (value < parseFloat(filter["value"])) {
            return false;
          }
        } else if (filter["operator"] === "<=") {
          if (value > parseFloat(filter["value"])) {
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
    let phageSelected =
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
      if (!phageSelected && taxonDetails["phage"]) {
        return false;
      }
      if (
        // Consider using the regular array includes function,
        // once we guarantee that all data is lower case
        !ArrayUtils.caseInsensitiveIncludes(
          categories,
          taxonDetails["category"]
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

  getTopTaxaPerSample(filteredTaxonIds, addedTaxonIds) {
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

    let topTaxIds = new Set();
    let topTaxonDetails = {};
    let filteredData = {};
    Object.values(sampleDetails).forEach(sample => {
      let filteredTaxaInSample = sample.taxa.filter(taxonId => {
        return filteredTaxonIds.has(taxonId);
      });

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
          if (!this.removedTaxonIds.has(taxId)) {
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
          }
        }
        count++;
      }
    });

    // Make sure that taxa manually added by the user that pass filters
    // are included.
    addedTaxonIds.forEach(taxId => {
      if (!topTaxIds.has(taxId)) {
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

  fetchNewTaxa(taxaMissingInfo) {
    return getTaxaDetails({
      sampleIds: this.state.sampleIds,
      taxonIds: taxaMissingInfo,
      removedTaxonIds: [],
      background: this.state.selectedOptions.background,
      updateBackgroundOnly: false,
      heatmapTs: this.props.heatmapTs,
    });
  }

  async updateTaxa(taxaMissingInfo) {
    const { allowedFeatures = [] } = (this.context = {});
    // Given a list of taxa for which details are currently missing,
    // fetch the information for those taxa from the server and
    // update the appropriate data structures to include the new taxa.
    this.setState({ loading: true });

    const newTaxaInfo = await this.fetchNewTaxa(taxaMissingInfo);
    const extractedData = allowedFeatures.includes("heatmap_service")
      ? this.extractDataFromService(newTaxaInfo)
      : this.extractData(newTaxaInfo);

    let {
      allData,
      allGeneraIds,
      allSpeciesIds,
      allTaxonIds,
      allTaxonDetails,
      sampleDetails,
    } = this.state;
    let tempAllData = extractedData.allData;

    allGeneraIds.concat(extractedData.allGeneraIds);
    allSpeciesIds.concat(extractedData.allSpeciesIds);

    extractedData.allTaxonIds.forEach(taxonId => {
      let taxon = extractedData.allTaxonDetails[taxonId];
      let tempTaxonIndex = taxon.index;
      let taxonIndex = allTaxonIds.length;
      taxon.index = taxonIndex;

      allTaxonIds.push(taxonId);
      allTaxonDetails[taxon.id] = taxon;
      allTaxonDetails[taxon.name] = taxon;

      Object.entries(sampleDetails).map(([sampleId, sample]) => {
        sample.taxa.concat(extractedData.sampleDetails[sampleId].taxa);
        let sampleIndex = sample.index;
        let tempSampleIndex = extractedData.sampleDetails[sampleId].index;

        this.props.metrics.forEach(metric => {
          allData[metric.value][taxonIndex] =
            allData[metric.value][taxonIndex] || [];
          allData[metric.value][taxonIndex][sampleIndex] =
            tempAllData[metric.value][tempTaxonIndex][tempSampleIndex];
        });
      });
    });
    this.setState(
      {
        allData,
        allGeneraIds,
        allSpeciesIds,
        allTaxonIds,
        allTaxonDetails,
        sampleDetails,
      },
      this.updateFilters
    );
  }

  handleAddedTaxonChange = selectedTaxonIds => {
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
      [...new Set([...taxonIds, ...addedTaxonIds])]
    );
    const previouslyAddedTaxa = intersection(
      [...addedTaxonIds],
      [...selectedTaxonIds]
    );
    const currentAddedTaxa = new Set([
      ...newlyAddedTaxa,
      ...previouslyAddedTaxa,
    ]);
    const newestTaxonId = newlyAddedTaxa[newlyAddedTaxa.length - 1];

    // Update notifiedFilteredOutTaxonIds to remove taxa that were unselected.
    const currentFilteredOutTaxonIds = new Set(
      intersection(notifiedFilteredOutTaxonIds, currentAddedTaxa)
    );

    // removedTaxonIds are taxa that passed filters
    // but were manually unselected by the user.
    let removedTaxonIds = new Set(difference(taxonIds, [...selectedTaxonIds]));
    removedTaxonIds.forEach(taxId => this.removedTaxonIds.add(taxId));
    selectedTaxonIds.forEach(taxId => {
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
      }
    );
    logAnalyticsEvent("SamplesHeatmapView_taxon_added", {
      selected: currentAddedTaxa,
    });
    this.updateHistoryState();
  };

  handleRemoveTaxon = taxonName => {
    let { addedTaxonIds } = this.state;
    let taxonId = this.state.allTaxonDetails[taxonName].id;
    this.removedTaxonIds.add(taxonId);
    addedTaxonIds.delete(taxonId);
    logAnalyticsEvent("SamplesHeatmapView_taxon_removed", {
      taxonId,
      taxonName,
    });
    this.setState({ addedTaxonIds }, this.updateFilters);
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
        tempSelectedOptions: this.getTempSelectedOptions(),
        onMetadataUpdate: this.handleMetadataUpdate,
        sampleId: this.state.selectedSampleId,
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
        // Don't re-notify the user if their manually selected taxa do not pass the new filters.
        notifiedFilteredOutTaxonIds: this.state.addedTaxonIds,
      },
      shouldRefetchData
        ? this.updateBackground
        : shouldRefilterData
        ? this.updateFilters
        : null
    );
  };

  updateBackground() {
    this.fetchBackground();
  }

  updateFilters() {
    this.filterTaxa();
  }

  // Maps SamplesHeatmapView threshold metric names to SampleView threshold metric names
  mapThresholdMetricName = metricName => {
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

  // TODO: In the future, it would be convenient to consolidate the selectedOptions (structure & threshold filter metric names)
  getTempSelectedOptions = () => {
    const { selectedOptions } = this.state;

    // Since the structure of the selectedOptions are different in the SampleView & SamplesHeatmapView components,
    // we map SamplesHeatmapView's selectedOptions into SampleView's selectedOptions structure
    // To checkout the differences between selectedOptions in both components, refer to their getDefaultSelectedOptions()
    return {
      background: selectedOptions.background,
      categories: {
        categories: selectedOptions.categories || [],
        subcategories: selectedOptions.subcategories || {},
      },
      // SampleView thresholds expect the metric format: nt:z_score
      // SamplesHeatmapView thresholds are in the format: NT_zscore so we convert them appropriately
      thresholds: map(threshold => {
        // i.e. r => count
        const mappedSampleViewThresholdValue = this.mapThresholdMetricName(
          threshold.metric.slice(3)
        );
        return {
          ...threshold,
          // Convert to lowercase and replace everything after the first _ with the mappedSampleViewThresholdValue
          // i.e. NT_r => nt:count
          metric: toLower(threshold.metric).replace(
            /_.*/,
            `:${mappedSampleViewThresholdValue}`
          ),
        };
      }, selectedOptions.thresholdFilters),
      readSpecificity: selectedOptions.readSpecificity,
    };
  };

  renderVisualization() {
    return (
      <div className="visualization-content">
        {this.state.loading ? this.renderLoading() : this.renderHeatmap()}
      </div>
    );
  }

  renderLoading() {
    const numSamples = this.state.sampleIds.length;
    return (
      <p className={cs.loadingIndicator}>
        <i className="fa fa-spinner fa-pulse fa-fw" />
        Loading for {numSamples} samples. Please expect to wait a few minutes.
      </p>
    );
  }

  renderHeatmap() {
    let shownTaxa = new Set(this.state.taxonIds, this.state.addedTaxonIds);
    shownTaxa = new Set(
      [...shownTaxa].filter(taxId => !this.removedTaxonIds.has(taxId))
    );
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
          onAddTaxon={this.handleAddedTaxonChange}
          newTaxon={this.state.newestTaxonId}
          onRemoveTaxon={this.handleRemoveTaxon}
          onSampleLabelClick={this.handleSampleLabelClick}
          onTaxonLabelClick={this.handleTaxonLabelClick}
          ref={vis => {
            this.heatmapVis = vis;
          }}
          sampleIds={this.state.sampleIds}
          sampleDetails={this.state.sampleDetails}
          scale={SCALE_OPTIONS[scaleIndex][1]}
          selectedTaxa={this.state.addedTaxonIds}
          selectedOptions={this.state.selectedOptions}
          // this.state.selectedOptions.species is 1 if species is selected, 0 otherwise.
          taxLevel={TAXON_LEVEL_SELECTED[this.state.selectedOptions.species]}
          tempSelectedOptions={this.getTempSelectedOptions()}
          allTaxonIds={
            this.state.selectedOptions.species
              ? this.state.allSpeciesIds
              : this.state.allGeneraIds
          }
          taxonIds={Array.from(shownTaxa)}
          taxonCategories={this.state.selectedOptions.categories}
          taxonDetails={this.state.allTaxonDetails} // send allTaxonDetails in case of added taxa
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

  renderInvalidSamplesWarning(onClose) {
    let { invalidSampleNames } = this.state;

    const header = (
      <div>
        <span className={cs.highlight}>
          {invalidSampleNames.length} sample
          {invalidSampleNames.length > 1 ? "s" : ""} won't be included in the
          heatmap
        </span>
        , because they either failed or are still processing:
      </div>
    );

    const content = (
      <span>
        {invalidSampleNames.map((name, index) => {
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

  renderFilteredOutWarning(onClose, taxon) {
    return (
      <Notification type="warning" displayStyle="elevated" onClose={onClose}>
        <div>
          <span className={cs.highlight}>
            {taxon.name} is filtered out by your current filter settings.
          </span>{" "}
          Remove some filters to see it appear.
        </div>
      </Notification>
    );
  }

  renderFilteredMultiplePipelineVersionsWarning(onClose, versions) {
    return (
      <Notification type="warning" displayStyle="elevated" onClose={onClose}>
        <div>
          <span className={cs.highlight}>
            The selected samples come from multiple major pipeline versions:{" "}
            {versions.join(", ")}.
          </span>
          A major change in the pipeline may produce results that are not
          comparable across all metrics. We recommend re-running samples on the
          latest major pipeline version.
        </div>
      </Notification>
    );
  }

  showNotification(notification, params) {
    switch (notification) {
      case NOTIFICATION_TYPES.invalidSamples:
        showToast(
          ({ closeToast }) => this.renderInvalidSamplesWarning(closeToast),
          {
            autoClose: 12000,
          }
        );
        break;
      case NOTIFICATION_TYPES.taxaFilteredOut:
        showToast(
          ({ closeToast }) => this.renderFilteredOutWarning(closeToast, params),
          {
            autoClose: 12000,
          }
        );
        break;
      case NOTIFICATION_TYPES.multiplePipelineVersions:
        showToast(
          ({ closeToast }) =>
            this.renderFilteredMultiplePipelineVersionsWarning(
              closeToast,
              params
            ),
          {
            autoClose: 12000,
          }
        );
        break;
      default:
        break;
    }
  }

  render() {
    const {
      addedTaxonIds,
      allGeneraIds,
      allSpeciesIds,
      data,
      enableMassNormalizedBackgrounds,
      hideFilters,
      loading,
      sampleIds,
      selectedOptions,
      selectedSampleId,
      sidebarMode,
      sidebarVisible,
      taxonIds,
    } = this.state;

    let shownTaxa = new Set(taxonIds, addedTaxonIds);
    shownTaxa = new Set(
      [...shownTaxa].filter(taxId => !this.removedTaxonIds.has(taxId))
    );

    return (
      <div className={cs.heatmap}>
        {!hideFilters && (
          <div>
            <NarrowContainer>
              <SamplesHeatmapHeader
                sampleIds={sampleIds}
                data={data}
                onDownloadSvg={this.handleDownloadSvg}
                onDownloadPng={this.handleDownloadPng}
                onDownloadCurrentHeatmapViewCsv={
                  this.getDownloadCurrentViewHeatmapCSVLink
                }
                onDownloadAllHeatmapMetricsCsv={this.handleDownloadCsv}
                onShareClick={this.handleShareClick}
                onSaveClick={this.handleSaveClick}
              />
            </NarrowContainer>
            <NarrowContainer>
              <SamplesHeatmapControls
                options={this.getControlOptions()}
                selectedOptions={selectedOptions}
                onSelectedOptionsChange={this.handleSelectedOptionsChange}
                loading={loading}
                data={data}
                filteredTaxaCount={shownTaxa.size}
                totalTaxaCount={
                  selectedOptions.species
                    ? allSpeciesIds.length
                    : allGeneraIds.length
                }
                prefilterConstants={this.props.prefilterConstants}
                enableMassNormalizedBackgrounds={
                  enableMassNormalizedBackgrounds
                }
              />
            </NarrowContainer>
          </div>
        )}
        <div className={cs.filterToggleContainer}>
          {hideFilters && <div className={cs.filterLine} />}
          <div
            className={cs.arrowIcon}
            onClick={withAnalytics(
              this.toggleDisplayFilters,
              "SamplesHeatmapFilters_toggle_clicked"
            )}
          >
            <SortIcon
              sortDirection={hideFilters ? "descending" : "ascending"}
            />
          </div>
        </div>
        {this.renderVisualization()}
        <DetailsSidebar
          visible={sidebarVisible}
          mode={sidebarMode}
          onClose={withAnalytics(
            this.closeSidebar,
            "SamplesHeatmapView_details-sidebar_closed",
            {
              sampleId: selectedSampleId,
              sidebarMode: sidebarMode,
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
  sampleIdsToProjectIds: PropTypes.array,
  savedParamValues: PropTypes.object,
  subcategories: PropTypes.object,
  removedTaxonIds: PropTypes.array,
  taxonLevels: PropTypes.array,
  thresholdFilters: PropTypes.object,
  heatmapTs: PropTypes.number,
  prefilterConstants: PropTypes.object,
};

SamplesHeatmapView.contextType = UserContext;

const mapDispatchToProps = { updateDiscoveryProjectIds: updateProjectIds };

// Don't need mapStateToProps yet so pass in null
const connectedComponent = connect(
  null,
  mapDispatchToProps
)(SamplesHeatmapView);

connectedComponent.name = "SamplesHeatmapView";

export default connectedComponent;
