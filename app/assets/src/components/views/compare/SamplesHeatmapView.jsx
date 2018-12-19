import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import queryString from "query-string";
import { set, min, max, uniq, pluck, values } from "lodash/fp";
import DeepEqual from "fast-deep-equal";
import { Popup } from "semantic-ui-react";
import copy from "copy-to-clipboard";
import { StickyContainer, Sticky } from "react-sticky";
import ErrorBoundary from "~/components/ErrorBoundary";
import SampleDetailsSidebar from "../report/SampleDetailsSidebar";
import { Divider, NarrowContainer, ViewHeader } from "~/components/layout";
import SequentialLegendVis from "~/components/visualizations/legends/SequentialLegendVis.jsx";
import Slider from "~ui/controls/Slider";
import { PrimaryButton } from "~ui/controls/buttons";
import {
  Dropdown,
  DownloadButtonDropdown,
  ThresholdFilterDropdown,
  MultipleNestedDropdown
} from "~ui/controls/dropdowns";
import { processMetadata } from "~utils/metadata";
import { get, getMetadataTypesByHostGenomeName } from "~/api";
import cs from "./samples_heatmap_view.scss";
import SamplesHeatmapVis from "./SamplesHeatmapVis";
import { extractMetadataTypesByHostGenomes } from "../../utils/metadata";

class SamplesHeatmapView extends React.Component {
  constructor(props) {
    super(props);

    // URL params have precedence
    this.urlParams = this.parseUrlParams();

    this.availableOptions = {
      specificityOptions: [
        { text: "All", value: 0 },
        { text: "Specific Only", value: 1 }
      ]
    };

    let parseAndCheckInt = (val, defaultVal) => {
      let parsed = parseInt(val);
      return isNaN(parsed) ? defaultVal : parsed;
    };

    this.state = {
      availableOptions: {
        // Server side options
        metrics: this.props.metrics,
        categories: this.props.categories || [],
        subcategories: this.props.subcategories || {},
        backgrounds: this.props.backgrounds,
        taxonLevels: this.props.taxonLevels.map(function(
          taxonLevelName,
          index
        ) {
          return { text: taxonLevelName, value: index };
        }),
        thresholdFilters: this.props.thresholdFilters,
        // Client side options
        scales: [["Log", "symlog"], ["Lin", "linear"]],
        taxonsPerSample: {
          min: 0,
          max: 100
        }
      },
      selectedOptions: {
        metric: this.urlParams.metric || (this.props.metrics[0] || {}).value,
        categories: this.urlParams.categories || [],
        subcategories: this.urlParams.subcategories || {},
        background:
          this.urlParams.background || this.props.backgrounds[0].value,
        species: parseAndCheckInt(this.urlParams.species, 1),
        thresholdFilters: this.urlParams.thresholdFilters || [],
        dataScaleIdx: parseAndCheckInt(this.urlParams.dataScaleIdx, 0),
        taxonsPerSample: parseAndCheckInt(this.urlParams.taxonsPerSample, 30),
        readSpecificity: this.availableOptions.specificityOptions[1].value
      },
      loading: false,
      sampleIds: this.urlParams.sampleIds || this.props.sampleIds,
      // If we made the sidebar visibility depend on sampleId !== null,
      // there would be a visual flicker when sampleId is set to null as the sidebar closes.
      selectedSampleId: null,
      sidebarVisible: false
    };

    this.removedTaxonIds = new Set(
      this.urlParams.removedTaxonIds || this.props.removedTaxonIds || []
    );
    this.lastRequestToken = null;
  }

  componentDidMount() {
    this.fetchViewData();
  }

  parseUrlParams() {
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
  }

  prepareParams() {
    let params = this.getUrlParams();

    // Parameters stored as objects
    params.thresholdFilters = JSON.stringify(params.thresholdFilters);
    params.subcategories = JSON.stringify(params.subcategories);
    return queryString.stringify(params, { arrayFormat: "bracket" });
  }

  downloadCurrentViewDataURL() {
    let url = new URL("/samples/download_heatmap", window.origin);
    location.href = `${url.toString()}?${this.prepareParams()}`;
  }

  getUrlForCurrentParams() {
    let url = new URL(location.pathname, window.origin);
    return `${url.toString()}?${this.prepareParams()}`;
  }

  onShareClick = () => {
    copy(this.getUrlForCurrentParams());
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

    return get("/samples/samples_taxons.json", {
      params: {
        sampleIds: this.state.sampleIds,
        removedTaxonIds: Array.from(this.removedTaxonIds),
        species: this.state.selectedOptions.species,
        categories: this.state.selectedOptions.categories,
        subcategories: this.state.selectedOptions.subcategories,
        sortBy: this.metricToSortField(this.state.selectedOptions.metric),
        thresholdFilters: this.state.selectedOptions.thresholdFilters,
        taxonsPerSample: this.state.selectedOptions.taxonsPerSample,
        readSpecificity: this.state.selectedOptions.readSpecificity
      },
      cancelToken: this.lastRequestToken.token
    });
  }

  fetchMetadataTypesByHostGenomeName() {
    if (this.state.metadataTypes) return null;
    return getMetadataTypesByHostGenomeName();
  }

  async fetchViewData() {
    this.setState({ loading: true });

    let [heatmapData, metadataTypesByHostGenomeName] = await Promise.all([
      this.fetchHeatmapData(),
      this.fetchMetadataTypesByHostGenomeName()
    ]);

    let newState = this.extractData(heatmapData);

    // Only calculate the metadataTypes once.
    if (metadataTypesByHostGenomeName !== null) {
      const distinctHostGenomeNames = uniq(
        pluck("host_genome_name", values(newState.sampleDetails))
      );

      newState.metadataTypes = extractMetadataTypesByHostGenomes(
        metadataTypesByHostGenomeName,
        distinctHostGenomeNames
      );
    }

    newState.loading = false;
    window.history.replaceState("", "", this.getUrlForCurrentParams());
    this.setState(newState);
  }

  extractData(rawData) {
    console.log("foobar 11:35am");
    console.log("rawData", rawData);
    let sampleIds = [];
    let sampleDetails = {};
    let taxonIds = [];
    let taxonDetails = {};
    let data = {};

    for (let i = 0; i < rawData.length; i++) {
      let sample = rawData[i];
      sampleIds.push(sample.sample_id);
      sampleDetails[sample.sample_id] = {
        id: sample.sample_id,
        name: sample.name,
        index: i,
        host_genome_name: sample.host_genome_name,
        metadata: processMetadata(sample.metadata)
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
              phage: !!taxon.is_phage
            };
            taxonDetails[taxon.name] = taxonDetails[taxon.tax_id];
          } else {
            taxonIndex = taxonDetails[taxon.tax_id].index;
          }

          this.state.availableOptions.metrics.forEach(metric => {
            let [metricType, metricName] = metric.value.split(".");
            data[metric.value] = data[metric.value] || [];
            data[metric.value][taxonIndex] =
              data[metric.value][taxonIndex] || [];
            data[metric.value][taxonIndex][i] = taxon[metricType][metricName];
          });
        }
      }
    }

    return {
      sampleDetails,
      taxonIds,
      taxonDetails,
      data
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

  renderLoading() {
    return (
      <p className={cs.loadingIndicator}>
        <i className="fa fa-spinner fa-pulse fa-fw" />
        Loading for {this.state.sampleIds.length} samples...
      </p>
    );
  }

  handleRemoveTaxon = taxonName => {
    let taxonId = this.state.taxonDetails[taxonName].id;
    this.removedTaxonIds.add(taxonId);
  };

  handleSampleLabelClick = sampleId => {
    if (this.state.sidebarVisible && this.state.selectedSampleId === sampleId) {
      this.handleSidebarClose();
    } else {
      this.setState({
        selectedSampleId: sampleId,
        sidebarVisible: true
      });
    }
  };

  handleSidebarClose = () => {
    this.setState({
      sidebarVisible: false
    });
  };

  renderLegend() {
    if (
      this.state.loading ||
      !this.state.data ||
      !(this.state.data[this.state.selectedOptions.metric] || []).length
    ) {
      return;
    }
    let values = this.state.data[this.state.selectedOptions.metric];
    let scaleIndex = this.state.selectedOptions.dataScaleIdx;

    return (
      <SequentialLegendVis
        min={min(values.map(array => min(array)))}
        max={max(values.map(array => max(array)))}
        scale={this.state.availableOptions.scales[scaleIndex][1]}
      />
    );
  }

  renderHeatmap() {
    if (
      this.state.loading ||
      !this.state.data ||
      Object.values(this.state.data).every(e => !e.length) ||
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
          scale={this.state.availableOptions.scales[scaleIndex][1]}
          onRemoveTaxon={this.handleRemoveTaxon}
          onSampleLabelClick={this.handleSampleLabelClick}
        />
      </ErrorBoundary>
    );
  }

  setSelectedOptionsState(stateChanges, callback) {
    this.setState(
      {
        selectedOptions: Object.assign(
          {},
          this.state.selectedOptions,
          stateChanges
        )
      },
      callback
    );
  }

  onMetricChange = metric => {
    if (metric == this.state.selectedOptions.metric) {
      return;
    }

    this.setSelectedOptionsState({ metric }, this.updateHeatmap);
  };

  renderMetricPicker() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.state.availableOptions.metrics}
        onChange={this.onMetricChange}
        value={this.state.selectedOptions.metric}
        label="Metric: "
        disabled={!this.state.data}
      />
    );
  }

  onThresholdFilterApply = filters => {
    if (DeepEqual(filters, this.state.selectedOptions.thresholdFilters)) {
      return;
    }

    this.setSelectedOptionsState(
      { thresholdFilters: filters },
      this.updateHeatmap
    );
  };

  renderAdvancedFilterPicker() {
    return (
      <ThresholdFilterDropdown
        options={this.state.availableOptions.thresholdFilters}
        thresholds={this.state.selectedOptions.thresholdFilters}
        onApply={this.onThresholdFilterApply}
        disabled={!this.state.data}
      />
    );
  }

  onTaxonLevelChange = taxonLevel => {
    if (this.state.selectedOptions.species == taxonLevel) {
      return;
    }

    this.setSelectedOptionsState({ species: taxonLevel }, this.updateHeatmap);
  };

  renderTaxonLevelPicker() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.state.availableOptions.taxonLevels}
        value={this.state.selectedOptions.species}
        onChange={this.onTaxonLevelChange}
        label="Taxon Level: "
        disabled={!this.state.data}
      />
    );
  }

  onDataScaleChange = scaleIdx => {
    if (scaleIdx == this.state.selectedOptions.dataScaleIdx) {
      return;
    }

    this.recluster = true;
    this.setSelectedOptionsState({ dataScaleIdx: scaleIdx });
  };

  renderScalePicker() {
    let options = this.state.availableOptions.scales.map(function(
      scale,
      index
    ) {
      return { text: scale[0], value: index };
    });

    return (
      <Dropdown
        fluid
        rounded
        value={this.state.selectedOptions.dataScaleIdx}
        onChange={this.onDataScaleChange}
        options={options}
        label="Scale: "
        disabled={!this.state.data}
      />
    );
  }

  onApplyClick() {
    this.updateHeatmap();
  }

  updateHeatmap() {
    this.fetchViewData();
  }

  getUrlParams() {
    return Object.assign(
      {
        sampleIds: this.state.sampleIds,
        removedTaxonIds: Array.from(this.removedTaxonIds)
      },
      this.state.selectedOptions
    );
  }

  onCategoryChange = (categories, subcategories) => {
    this.setSelectedOptionsState(
      { categories, subcategories },
      this.updateHeatmap
    );
  };

  renderCategoryFilter() {
    let options = this.state.availableOptions.categories.map(category => {
      let option = { text: category, value: category };
      let subcategories = this.state.availableOptions.subcategories[category];
      if (Array.isArray(subcategories)) {
        option.suboptions = subcategories.map(subcategory => {
          return { text: subcategory, value: subcategory };
        });
      }
      return option;
    });

    return (
      <MultipleNestedDropdown
        fluid
        rounded
        options={options}
        onChange={this.onCategoryChange}
        selectedOptions={this.state.selectedOptions.categories}
        selectedSuboptions={this.state.selectedOptions.subcategories}
        label="Taxon Categories:"
        disabled={!this.state.data}
      />
    );
  }

  onBackgroundChanged = background => {
    if (background == this.state.selectedOptions.background) {
      return;
    }

    this.setSelectedOptionsState({ background }, this.updateHeatmap);
  };

  renderBackgroundPicker() {
    let options = this.state.availableOptions.backgrounds.map(function(
      background
    ) {
      return { text: background.name, value: background.value };
    });

    return (
      <Dropdown
        fluid
        rounded
        options={options}
        onChange={this.onBackgroundChanged}
        value={this.state.selectedOptions.background}
        label="Background: "
        disabled={!this.state.data}
      />
    );
  }

  onTaxonsPerSampleEnd = newValue => {
    this.setSelectedOptionsState(
      { taxonsPerSample: newValue },
      this.updateHeatmap
    );
  };

  renderTaxonsPerSampleSlider() {
    return (
      <Slider
        label="Taxa per Sample: "
        min={this.state.availableOptions.taxonsPerSample.min}
        max={this.state.availableOptions.taxonsPerSample.max}
        value={this.state.selectedOptions.taxonsPerSample}
        onChange={this.onTaxonsPerSampleChange}
        onAfterChange={this.onTaxonsPerSampleEnd}
      />
    );
  }

  onSpecificityChange = specificity => {
    if (specificity === this.state.selectedOptions.readSpecificity) {
      return;
    }

    this.setSelectedOptionsState(
      { readSpecificity: specificity },
      this.updateHeatmap
    );
  };

  renderSpecificityFilter() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.availableOptions.specificityOptions}
        value={this.state.selectedOptions.readSpecificity}
        label="Read Specificity: "
        onChange={this.onSpecificityChange}
      />
    );
  }

  renderSubMenu() {
    return (
      <div className={cs.menu}>
        <Divider />
        <div className={`${cs.filterRow} row`}>
          <div className="col s3">{this.renderTaxonLevelPicker()}</div>
          <div className="col s3">{this.renderCategoryFilter()}</div>
          <div className="col s3">{this.renderMetricPicker()}</div>
          <div className="col s3">{this.renderBackgroundPicker()}</div>
        </div>
        <div className={`${cs.filterRow} row`}>
          <div className="col s3">{this.renderAdvancedFilterPicker()}</div>
          <div className="col s3">{this.renderSpecificityFilter()}</div>
          <div className="col s2">{this.renderScalePicker()}</div>
          <div className="col s2">{this.renderTaxonsPerSampleSlider()}</div>
          <div className="col s2">{this.renderLegend()}</div>
        </div>
        <Divider />
      </div>
    );
  }

  renderVisualization() {
    return (
      <div className="row visualization-content">
        {this.state.loading ? this.renderLoading() : this.renderHeatmap()}
      </div>
    );
  }

  handleDownloadClick = fileType => {
    switch (fileType) {
      case "svg":
        this.heatmapVis.download();
        break;
      case "csv":
        this.downloadCurrentViewDataURL();
        break;
      default:
        break;
    }
  };

  render() {
    let downloadOptions = [
      { text: "Download CSV", value: "csv" },
      { text: "Download SVG", value: "svg" }
    ];

    return (
      <div className={cs.heatmap}>
        <div>
          <ViewHeader className={cs.viewHeader}>
            <ViewHeader.Content>
              <ViewHeader.Pretitle>Heatmap</ViewHeader.Pretitle>
              <ViewHeader.Title
                label={`Comparing ${
                  this.state.sampleIds ? this.state.sampleIds.length : ""
                } Samples`}
              />
            </ViewHeader.Content>
            <ViewHeader.Controls>
              <Popup
                trigger={
                  <PrimaryButton
                    text="Share"
                    onClick={this.onShareClick}
                    className={cs.controlElement}
                  />
                }
                content="A shareable URL has been copied to your clipboard!"
                on="click"
                hideOnScroll
              />
              <DownloadButtonDropdown
                className={cs.controlElement}
                options={downloadOptions}
                onClick={this.handleDownloadClick}
                disabled={!this.state.data}
              />
            </ViewHeader.Controls>
          </ViewHeader>
        </div>
        <StickyContainer>
          <Sticky>
            {({ style }) => (
              <div style={style}>
                <NarrowContainer>{this.renderSubMenu()}</NarrowContainer>
              </div>
            )}
          </Sticky>
          {this.renderVisualization()}
        </StickyContainer>
        <SampleDetailsSidebar
          showReportLink
          visible={this.state.sidebarVisible}
          onClose={this.handleSidebarClose}
          sampleId={this.state.selectedSampleId}
          onMetadataUpdate={this.handleMetadataUpdate}
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
  subcategories: PropTypes.object,
  removedTaxonIds: PropTypes.array,
  taxonLevels: PropTypes.array,
  thresholdFilters: PropTypes.object
};

export default SamplesHeatmapView;
