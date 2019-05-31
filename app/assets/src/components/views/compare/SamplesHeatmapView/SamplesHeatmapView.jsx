import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import queryString from "query-string";
import {
  compact,
  map,
  isEqual,
  keys,
  assign,
  get,
  set,
  isEmpty
} from "lodash/fp";
import DeepEqual from "fast-deep-equal";
import { StickyContainer, Sticky } from "react-sticky";

import ErrorBoundary from "~/components/ErrorBoundary";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { NarrowContainer } from "~/components/layout";
import { copyShortUrlToClipboard } from "~/helpers/url";
import { processMetadata } from "~utils/metadata";
import { getSampleTaxons, saveVisualization } from "~/api";
import { getSampleMetadataFields } from "~/api/metadata";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import SamplesHeatmapVis from "~/components/views/compare/SamplesHeatmapVis";

import cs from "./samples_heatmap_view.scss";
import SamplesHeatmapControls from "./SamplesHeatmapControls";
import SamplesHeatmapHeader from "./SamplesHeatmapHeader";

const SCALE_OPTIONS = [["Log", "symlog"], ["Lin", "linear"]];
const TAXONS_PER_SAMPLE_RANGE = {
  min: 0,
  max: 100
};
const SPECIFICITY_OPTIONS = [
  { text: "All", value: 0 },
  { text: "Specific Only", value: 1 }
];

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
      ...props.savedParamValues,
      ...this.urlParams
    };

    // TODO (gdingle): remove gating when we go live with data discovery
    if (
      this.props.allowedFeatures &&
      this.props.allowedFeatures.includes("data_discovery")
    ) {
      this.initOnBeforeUnload(props.savedParamValues);
    }

    this.state = {
      selectedOptions: {
        metric: this.urlParams.metric || (this.props.metrics[0] || {}).value,
        categories: this.urlParams.categories || [],
        subcategories: this.urlParams.subcategories || {},
        background: parseAndCheckInt(
          this.urlParams.background,
          this.props.backgrounds[0].value
        ),
        species: parseAndCheckInt(this.urlParams.species, 1),
        thresholdFilters: this.urlParams.thresholdFilters || [],
        dataScaleIdx: parseAndCheckInt(this.urlParams.dataScaleIdx, 0),
        taxonsPerSample: parseAndCheckInt(this.urlParams.taxonsPerSample, 30),
        readSpecificity: parseAndCheckInt(this.urlParams.readSpecificity, 1)
      },
      loading: false,
      sampleIds: compact(
        map(parseAndCheckInt, this.urlParams.sampleIds || this.props.sampleIds)
      ),
      // If we made the sidebar visibility depend on sampleId !== null,
      // there would be a visual flicker when sampleId is set to null as the sidebar closes.
      selectedSampleId: null,
      sidebarMode: null,
      sidebarVisible: false,
      sidebarTaxonModeConfig: null,
      taxonFilterState: []
    };

    this.removedTaxonIds = new Set(
      this.urlParams.removedTaxonIds || this.props.removedTaxonIds || []
    );
    this.lastRequestToken = null;
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
      arrayFormat: "bracket"
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
      urlParams.thresholdFilters = JSON.parse(urlParams.thresholdFilters);
    }
    return urlParams;
  };

  getUrlParams = () => {
    return Object.assign(
      {
        sampleIds: this.state.sampleIds,
        removedTaxonIds: Array.from(this.removedTaxonIds)
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
    location.href = `${url.toString()}?${this.prepareParams()}`;
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
    // TODO (gdingle): make back button load previous vis state
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
        heatmapTs: this.props.heatmapTs
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
      this.fetchMetadataFieldsBySampleIds()
    ]);

    let newState = this.extractData(heatmapData);

    // Only calculate the metadataTypes once.
    if (metadataFields !== null) {
      newState.metadataTypes = metadataFields;
    }

    newState.loading = false;
    // TODO (gdingle): change to pushState to preserve back button behavior?
    window.history.replaceState("", "", this.getUrlForCurrentParams());
    this.setState(newState);
  }

  extractData(rawData) {
    let sampleIds = [];
    let sampleDetails = {};
    let taxonIds = [];
    let taxonDetails = {};
    let data = {};
    let taxonFilterState = {};

    for (let i = 0; i < rawData.length; i++) {
      let sample = rawData[i];
      sampleIds.push(sample.sample_id);
      sampleDetails[sample.sample_id] = {
        id: sample.sample_id,
        name: sample.name,
        index: i,
        host_genome_name: sample.host_genome_name,
        metadata: processMetadata(sample.metadata, true)
      };
      if (sample.taxons) {
        for (let j = 0; j < sample.taxons.length; j++) {
          let taxon = sample.taxons[j];
          let taxonIndex;
          if (!(taxon.tax_id in taxonDetails)) {
            taxonIndex = taxonIds.length;
            taxonIds.push(taxon.tax_id);
            taxonDetails[taxon.tax_id] = {
              id: taxon.tax_id,
              index: taxonIndex,
              name: taxon.name,
              category: taxon.category_name,
              parentId:
                taxon.tax_id === taxon.species_taxid && taxon.genus_taxid,
              phage: !!taxon.is_phage
            };
            taxonDetails[taxon.name] = taxonDetails[taxon.tax_id];
          } else {
            taxonIndex = taxonDetails[taxon.tax_id].index;
          }

          this.props.metrics.forEach(metric => {
            let [metricType, metricName] = metric.value.split(".");
            data[metric.value] = data[metric.value] || [];
            data[metric.value][taxonIndex] =
              data[metric.value][taxonIndex] || [];
            data[metric.value][taxonIndex][i] = taxon[metricType][metricName];
          });

          taxonFilterState[taxonIndex] = taxonFilterState[taxonIndex] || {};
          taxonFilterState[taxonIndex][i] = taxon.filtered;
        }
      }
    }

    return {
      // The server should always pass back the same set of sampleIds, but possibly in a different order.
      // We overwrite both this.state.sampleDetails and this.state.sampleIds to make sure the two are in sync.
      sampleIds,
      sampleDetails,
      taxonIds,
      taxonDetails,
      data,
      taxonFilterState
    };
  }

  handleMetadataUpdate = (key, value) => {
    this.setState({
      sampleDetails: set(
        [this.state.selectedSampleId, "metadata", key],
        value,
        this.state.sampleDetails
      )
    });
  };

  handleRemoveTaxon = taxonName => {
    let taxonId = this.state.taxonDetails[taxonName].id;
    this.removedTaxonIds.add(taxonId);
    logAnalyticsEvent("SamplesHeatmapView_taxon_removed", {
      taxonId,
      taxonName
    });
  };

  handleSampleLabelClick = sampleId => {
    if (!sampleId) {
      this.setState({
        sidebarVisible: false
      });
      return;
    }

    if (
      this.state.sidebarVisible &&
      this.state.sidebarMode === "sampleDetails" &&
      this.state.selectedSampleId === sampleId
    ) {
      this.setState({
        sidebarVisible: false
      });
      logAnalyticsEvent("SamplesHeatmapView_sample-details-sidebar_closed", {
        sampleId: sampleId,
        sidebarMode: "sampleDetails"
      });
    } else {
      this.setState({
        selectedSampleId: sampleId,
        sidebarMode: "sampleDetails",
        sidebarVisible: true
      });
      logAnalyticsEvent("SamplesHeatmapView_sample-details-sidebar_opened", {
        sampleId: sampleId,
        sidebarMode: "sampleDetails"
      });
    }
  };

  handleTaxonLabelClick = taxonName => {
    const taxonDetails = get(taxonName, this.state.taxonDetails);

    if (!taxonDetails) {
      this.setState({
        sidebarVisible: false
      });
      return;
    }

    if (
      this.state.sidebarMode === "taxonDetails" &&
      this.state.sidebarVisible &&
      taxonName === get("taxonName", this.state.sidebarTaxonModeConfig)
    ) {
      this.setState({
        sidebarVisible: false
      });
      logAnalyticsEvent("SamplesHeatmapView_taxon-details-sidebar_closed", {
        parentTaxonId: taxonDetails.parentId,
        taxonId: taxonDetails.id,
        taxonName,
        sidebarMode: "taxonDetails"
      });
    } else {
      this.setState({
        sidebarMode: "taxonDetails",
        sidebarTaxonModeConfig: {
          parentTaxonId: taxonDetails.parentId,
          taxonId: taxonDetails.id,
          taxonName
        },
        sidebarVisible: true
      });
      logAnalyticsEvent("SamplesHeatmapView_taxon-details-sidebar_opened", {
        parentTaxonId: taxonDetails.parentId,
        taxonId: taxonDetails.id,
        taxonName,
        sidebarMode: "taxonDetails"
      });
    }
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false
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
        showReportLink: true
      };
    }
    return {};
  };

  getControlOptions = () => ({
    // Server side options
    metrics: this.props.metrics,
    categories: this.props.categories || [],
    subcategories: this.props.subcategories || {},
    backgrounds: this.props.backgrounds,
    taxonLevels: this.props.taxonLevels.map((taxonLevelName, index) => ({
      text: taxonLevelName,
      value: index
    })),
    thresholdFilters: this.props.thresholdFilters,
    // Client side options
    scales: SCALE_OPTIONS,
    taxonsPerSample: TAXONS_PER_SAMPLE_RANGE,
    specificityOptions: SPECIFICITY_OPTIONS
  });

  handleSelectedOptionsChange = newOptions => {
    const refetchData = !isEqual(keys(newOptions), ["dataScaleIdx"]);

    this.setState(
      {
        selectedOptions: assign(this.state.selectedOptions, newOptions)
      },
      refetchData ? this.updateHeatmap : null
    );
  };

  updateHeatmap() {
    this.fetchViewData();
  }

  renderVisualization() {
    return (
      <div className="row visualization-content">
        {this.state.loading ? this.renderLoading() : this.renderHeatmap()}
      </div>
    );
  }

  renderLoading() {
    return (
      <p className={cs.loadingIndicator}>
        <i className="fa fa-spinner fa-pulse fa-fw" />
        Loading for {this.state.sampleIds.length} samples...
      </p>
    );
  }

  renderHeatmap() {
    if (
      this.state.loading ||
      !this.state.data ||
      !(this.state.data[this.state.selectedOptions.metric] || []).length ||
      !this.state.metadataTypes
    ) {
      return <div className={cs.noDataMsg}>No data to render</div>;
    }
    let scaleIndex = this.state.selectedOptions.dataScaleIdx;

    return (
      <ErrorBoundary>
        <SamplesHeatmapVis
          ref={vis => {
            this.heatmapVis = vis;
          }}
          sampleIds={this.state.sampleIds}
          sampleDetails={this.state.sampleDetails}
          taxonIds={this.state.taxonIds}
          taxonDetails={this.state.taxonDetails}
          data={this.state.data}
          metadataTypes={this.state.metadataTypes}
          metric={this.state.selectedOptions.metric}
          scale={SCALE_OPTIONS[scaleIndex][1]}
          onRemoveTaxon={this.handleRemoveTaxon}
          onSampleLabelClick={this.handleSampleLabelClick}
          onTaxonLabelClick={this.handleTaxonLabelClick}
          taxonFilterState={this.state.taxonFilterState}
        />
      </ErrorBoundary>
    );
  }

  render() {
    return (
      <div className={cs.heatmap}>
        <NarrowContainer>
          <SamplesHeatmapHeader
            sampleIds={this.state.sampleIds}
            data={this.state.data}
            allowedFeatures={this.props.allowedFeatures}
            onDownloadSvg={this.handleDownloadSvg}
            onDownloadPng={this.handleDownloadPng}
            onDownloadCsv={this.handleDownloadCsv}
            onShareClick={this.handleShareClick}
            onSaveClick={this.handleSaveClick}
          />
        </NarrowContainer>
        <StickyContainer>
          <Sticky>
            {({ style }) => (
              <div style={style}>
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
          </Sticky>
          {this.renderVisualization()}
        </StickyContainer>
        <DetailsSidebar
          visible={this.state.sidebarVisible}
          mode={this.state.sidebarMode}
          onClose={withAnalytics(
            this.closeSidebar,
            "SamplesHeatmapView_details-sidebar_closed",
            {
              sampleId: this.state.selectedSampleId,
              sidebarMode: this.state.sidebarMode
            }
          )}
          params={this.getSidebarParams()}
        />
      </div>
    );
  }
}

SamplesHeatmapView.propTypes = {
  allowedFeatures: PropTypes.array,
  backgrounds: PropTypes.array,
  categories: PropTypes.array,
  metrics: PropTypes.array,
  sampleIds: PropTypes.array,
  savedParamValues: PropTypes.object,
  subcategories: PropTypes.object,
  removedTaxonIds: PropTypes.array,
  taxonLevels: PropTypes.array,
  thresholdFilters: PropTypes.object,
  heatmapTs: PropTypes.number
};

export default SamplesHeatmapView;
