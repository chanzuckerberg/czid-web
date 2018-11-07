import React from "react";
import clusterfck from "clusterfck";
import axios from "axios";
import d3 from "d3";
import queryString from "query-string";
import { Popup } from "semantic-ui-react";
import copy from "copy-to-clipboard";
import { StickyContainer, Sticky } from "react-sticky";
import symlog from "./symlog";
import DownloadButton from "./ui/controls/buttons/DownloadButton";
import Dropdown from "./ui/controls/dropdowns/Dropdown";
import ErrorBoundary from "./ErrorBoundary";
import Heatmap from "./visualizations/Heatmap";
import HeatmapLegend from "./visualizations/HeatmapLegend";
import MultipleNestedDropdown from "./ui/controls/dropdowns/MultipleNestedDropdown";
import PrimaryButton from "./ui/controls/buttons/PrimaryButton";
import PropTypes from "prop-types";
import Slider from "./ui/controls/Slider";
import TaxonTooltip from "./TaxonTooltip";
import ThresholdFilterDropdown from "./ui/controls/dropdowns/ThresholdFilterDropdown";
import { Colormap } from "./utils/colormaps/Colormap";
import DeepEqual from "fast-deep-equal";

class SamplesHeatmap extends React.Component {
  // TODO: do not make another request if values did not change

  constructor(props) {
    super(props);

    this.colors = Colormap.getNScale("viridis", 10).reverse();

    // URL params have precedence
    this.urlParams = this.parseUrlParams();

    this.availableOptions = {
      specificityOptions: [
        { text: "All", value: 0 },
        { text: "Specific Only", value: 1 }
      ]
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
        scales: [["Log", symlog], ["Lin", d3.scale.linear]],
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
        species: parseInt(this.urlParams.species) || 1,
        thresholdFilters: this.urlParams.thresholdFilters || [],
        dataScaleIdx: parseInt(this.urlParams.dataScaleIdx) || 0,
        taxonsPerSample: parseInt(this.urlParams.taxonsPerSample) || 30,
        readSpecificity: this.availableOptions.specificityOptions[1].value
      },
      data: null,
      taxons: {},
      loading: false,
      sampleIds: this.urlParams.sampleIds || this.props.sampleIds,
      taxonIds: this.urlParams.taxonIds || this.props.taxonIds || []
    };

    this.lastRequestToken = null;

    this.explicitApply = this.props.explicitApply || false;
    this.optionsChanged = false;

    // Note: copies references of nested objects
    this.appliedOptions = Object.assign({}, this.state.selectedOptions);

    this.dataGetters = {};
    this.dataAccessorKeys = {};
    for (let metric of this.state.availableOptions.metrics) {
      this.dataGetters[metric.value] = this.makeDataGetter(metric.value);
      this.dataAccessorKeys[metric.value] = metric.value.split(".");
    }

    this.getColumnLabel = this.getColumnLabel.bind(this);
    this.getRowLabel = this.getRowLabel.bind(this);
    this.getTaxonFor = this.getTaxonFor.bind(this);
    this.getTooltip = this.getTooltip.bind(this);
    this.onApplyClick = this.onApplyClick.bind(this);
    this.onCellClick = this.onCellClick.bind(this);
    this.onRemoveRow = this.onRemoveRow.bind(this);
    this.onSampleLabelClick = this.onSampleLabelClick.bind(this);
    this.onShareClick = this.onShareClick.bind(this);
    this.onTaxonsPerSampleEnd = this.onTaxonsPerSampleEnd.bind(this);
    this.onThresholdFilterApply = this.onThresholdFilterApply.bind(this);
  }

  componentDidMount() {
    this.fetchDataFromServer();
  }

  parseUrlParams() {
    let urlParams = queryString.parse(location.search, {
      arrayFormat: "bracket"
    });

    // consider the cases where variables can be passed as array string
    if (typeof urlParams.sampleIds === "string") {
      urlParams.sampleIds = urlParams.sampleIds.split(",");
    }
    if (typeof urlParams.taxonIds === "string") {
      urlParams.taxonIds = urlParams.taxonIds.split(",");
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
    return `${url.toString()}?${this.prepareParams()}`;
  }

  onShareClick() {
    let url = new URL(location.pathname, window.origin);
    copy(`${url.toString()}?${this.prepareParams()}`);
  }

  getDataProperty(data, property) {
    let keys = this.dataAccessorKeys[property];
    return data[keys[0]][keys[1]];
  }

  makeDataGetter(metric) {
    return function(row, col) {
      let taxon = this.getTaxonFor(row, col);
      if (taxon) {
        return this.getDataProperty(taxon, metric);
      }
    }.bind(this);
  }

  metricToSortField(metric) {
    // TODO: change into a json object - requires server changes
    let fields = metric.split(".");
    let countType = fields[0].toLowerCase();
    let metricName = fields[1].toLowerCase();

    return "highest_" + countType + "_" + metricName;
  }

  fetchDataFromServer() {
    this.setState({ loading: true });

    if (this.lastRequestToken)
      this.lastRequestToken.cancel("Parameters changed");

    this.lastRequestToken = axios.CancelToken.source();
    axios
      .get("/samples/samples_taxons.json", {
        params: {
          sampleIds: this.state.sampleIds,
          taxonIds: this.state.taxonIds,
          species: this.state.selectedOptions.species,
          categories: this.state.selectedOptions.categories,
          subcategories: this.state.selectedOptions.subcategories,
          sortBy: this.metricToSortField(this.state.selectedOptions.metric),
          thresholdFilters: this.state.selectedOptions.thresholdFilters,
          taxonsPerSample: this.state.selectedOptions.taxonsPerSample,
          readSpecificity: this.state.selectedOptions.readSpecificity
        },
        cancelToken: this.lastRequestToken.token
      })
      .then(response => {
        let taxons = this.extractTaxons(response.data);
        this.recluster = true;
        this.setState({
          data: response.data,
          taxons: taxons,
          loading: false
        });
      })
      .catch(thrown => {
        // TODO: process error if not cancelled request by client: if (!axios.isCancel(thrown) {
      });
  }

  getMinMax(taxonNames) {
    let data = this.state.data;
    let metric = this.state.selectedOptions.metric;
    let taxonLists = [];
    taxonNames = new Set(taxonNames);
    for (let sample of data) {
      let sampleTaxons = [];
      for (let taxon of sample.taxons) {
        if (taxonNames.has(taxon.name)) {
          taxonLists.push(taxon);
        }
      }
      taxonLists.push(sampleTaxons);
    }
    let taxons = [].concat.apply([], taxonLists);
    let min = d3.min(taxons, taxon => {
      return this.getDataProperty(taxon, metric);
    });
    let max = d3.max(taxons, taxon => {
      return this.getDataProperty(taxon, metric);
    });
    let thresholdMin = d3.min(taxons, taxon => {
      return this.getDataProperty(taxon, metric);
    });

    let thresholdMax = d3.max(taxons, taxon => {
      return this.getDataProperty(taxon, metric);
    });

    return {
      min: min,
      max: max,
      thresholdMin: thresholdMin,
      thresholdMax: thresholdMax
    };
  }

  clusterSamples(data, metric, taxons) {
    let vectors = [];
    for (let sample of data) {
      let vector = [];
      for (let taxonName of taxons) {
        let value = null;
        for (let taxon of sample.taxons) {
          if (taxon.name == taxonName) {
            value = this.getDataProperty(taxon, metric);
            break;
          }
        }
        vector.push(value);
      }
      vector.sample = sample;
      vectors.push(vector);
    }

    let cluster = clusterfck.hcluster(vectors);

    let clusteredSamples = [];
    let toVisit = [cluster];
    while (toVisit.length > 0) {
      let node = toVisit.pop();
      if (node.right) {
        toVisit.push(node.right);
      }
      if (node.left) {
        toVisit.push(node.left);
      }

      if (node.value) {
        node.label = node.value.sample.name;
        clusteredSamples.push(node.value.sample);
      }
    }

    return {
      tree: cluster,
      flat: clusteredSamples.reverse()
    };
  }

  extractTaxons(data) {
    let idToName = {},
      idToCategory = {},
      nameToId = {},
      ids = new Set(),
      categories = new Set();

    for (var i = 0, len = data.length; i < len; i += 1) {
      let sample = data[i];
      for (var j = 0; j < sample.taxons.length; j += 1) {
        let taxon = sample.taxons[j];
        idToName[taxon.tax_id] = taxon.name;
        idToCategory[taxon.tax_id] = taxon.category_name;
        nameToId[taxon.name] = taxon.tax_id;
        ids.add(taxon.tax_id);
        categories.add(taxon.category_name);
      }
    }

    return {
      idToName: idToName,
      idToCategory: idToCategory,
      nameToId: nameToId,
      ids: Array.from(ids),
      names: Object.keys(nameToId),
      categories: Array.from(categories).sort()
    };
  }

  clusterTaxons(data, dataType, taxonNames) {
    let taxonScores = {};
    for (let taxon of taxonNames) {
      taxonScores[taxon] = [];

      for (let sample of data) {
        let value = null;
        for (let sampleTaxon of sample.taxons) {
          if (sampleTaxon.name == taxon) {
            value = this.getDataProperty(sampleTaxon, dataType);
            break;
          }
        }
        taxonScores[taxon].push(value);
      }
    }

    let vectors = [];
    for (let key of Object.keys(taxonScores)) {
      let vector = taxonScores[key];
      vector.taxonName = key;
      vectors.push(vector);
    }
    let cluster = clusterfck.hcluster(vectors);
    if (!cluster) {
      return {};
    }
    let clusteredTaxons = [];
    let toVisit = [cluster];
    while (toVisit.length > 0) {
      let node = toVisit.pop();
      if (node.right) {
        toVisit.push(node.right);
      }
      if (node.left) {
        toVisit.push(node.left);
      }

      if (node.value) {
        node.label = node.value.taxonName;
        clusteredTaxons.push(node.value.taxonName);
      }
    }

    return {
      tree: cluster,
      flat: clusteredTaxons
    };
  }

  getColumnLabel(columnIndex) {
    return this.clusteredSamples.flat[columnIndex].name;
  }

  getRowLabel(rowIndex) {
    return this.clusteredTaxons.flat[rowIndex];
  }

  getTaxonFor(rowIndex, columnIndex) {
    let d = this.clusteredSamples.flat[columnIndex];
    let taxonName = this.clusteredTaxons.flat[rowIndex];

    for (let i = 0; i < d.taxons.length; i += 1) {
      let taxon = d.taxons[i];
      if (taxon.name == taxonName) {
        return taxon;
      }
    }
    return undefined;
  }

  getTooltip(rowIndex, columnIndex) {
    let sample = this.clusteredSamples.flat[columnIndex],
      taxonName = this.clusteredTaxons.flat[rowIndex],
      taxon;

    for (let i = 0; i < sample.taxons.length; i += 1) {
      let ttaxon = sample.taxons[i];
      if (ttaxon.name == taxonName) {
        taxon = ttaxon;
        break;
      }
    }

    return <TaxonTooltip sample={sample} taxon={taxon} />;
  }

  renderLoading() {
    return (
      <p className="loading-indicator text-center">
        <i className="fa fa-spinner fa-pulse fa-fw" />
        Loading for {this.state.sampleIds.length} samples...
      </p>
    );
  }

  onSampleLabelClick(d, i) {
    let sample = this.clusteredSamples.flat[i];
    window.location.href = "/samples/" + sample.sample_id;
  }

  onCellClick(d) {
    let sample = this.clusteredSamples.flat[d.col];
    window.location.href = "/samples/" + sample.sample_id;
  }

  onRemoveRow(rowLabel) {
    let taxons = this.state.taxons;
    let id = taxons.nameToId[rowLabel];

    let idx = taxons.names.indexOf(rowLabel);
    taxons.names.splice(idx, 1);

    idx = taxons.ids.indexOf(id);
    taxons.ids.splice(idx, 1);

    delete taxons.nameToId[rowLabel];
    delete taxons.idToName[id];
    this.recluster = true;
    this.setState({
      taxons: taxons
    });
  }

  renderHeatmap() {
    if (this.state.loading || !this.state.data || !this.state.data.length) {
      return;
    }
    let scaleIndex = this.state.selectedOptions.dataScaleIdx;
    return (
      <ErrorBoundary>
        <Heatmap
          colTree={this.clusteredSamples.tree}
          rowTree={this.clusteredTaxons.tree}
          rows={this.state.taxons.names.length}
          columns={this.state.data.length}
          getRowLabel={this.getRowLabel}
          getColumnLabel={this.getColumnLabel}
          getCellValue={this.dataGetters[this.state.selectedOptions.metric]}
          getTooltip={this.getTooltip}
          onCellClick={this.onCellClick}
          onColumnLabelClick={this.onSampleLabelClick}
          onRemoveRow={this.onRemoveRow}
          scale={this.state.availableOptions.scales[scaleIndex][1]}
          colors={this.colors}
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

    this.optionsChanged = true;
    this.setSelectedOptionsState(
      { metric },
      this.explicitApply ? undefined : this.updateHeatmap
    );
  };

  renderMetricPicker() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.state.availableOptions.metrics}
        onChange={this.onMetricChange}
        value={this.state.selectedOptions.metric}
        label="Metric:"
        disabled={!this.state.data}
      />
    );
  }

  onThresholdFilterApply(filters) {
    if (DeepEqual(filters, this.state.selectedOptions.thresholdFilters)) {
      return;
    }

    this.optionsChanged = true;
    this.setSelectedOptionsState(
      { thresholdFilters: filters },
      this.explicitApply ? undefined : this.updateHeatmap
    );
  }

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

    this.optionsChanged = true;
    this.setSelectedOptionsState(
      { species: taxonLevel },
      this.explicitApply ? undefined : this.updateHeatmap
    );
  };

  renderTaxonLevelPicker() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.state.availableOptions.taxonLevels}
        value={this.state.selectedOptions.species}
        onChange={this.onTaxonLevelChange}
        label="Taxon Level:"
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
        label="Scale:"
        disabled={!this.state.data}
      />
    );
  }

  renderLegend() {
    return (
      <HeatmapLegend
        colors={this.colors}
        min={this.minMax ? this.minMax.thresholdMin : 0}
        max={this.minMax ? this.minMax.thresholdMax : 1}
        disabled={!this.state.data || !this.minMax}
      />
    );
  }

  onApplyClick() {
    this.updateHeatmap();
  }

  updateHeatmap() {
    this.fetchDataFromServer();
    this.optionsChanged = false;
  }

  getUrlParams() {
    return Object.assign(
      {
        sampleIds: this.state.sampleIds,
        taxonIds: this.state.taxonIds
      },
      this.state.selectedOptions
    );
  }

  onCategoryChange = (categories, subcategories) => {
    this.optionsChanged = true;
    this.setSelectedOptionsState(
      { categories, subcategories },
      this.explicitApply ? undefined : this.updateHeatmap
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

    this.optionsChanged = true;
    this.setSelectedOptionsState(
      { background },
      this.explicitApply ? undefined : this.updateHeatmap
    );
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
        label="Background:"
        disabled={!this.state.data}
      />
    );
  }

  onTaxonsPerSampleEnd(newValue) {
    this.optionsChanged = true;
    this.setSelectedOptionsState(
      { taxonsPerSample: newValue },
      this.explicitApply ? undefined : this.updateHeatmap
    );
  }

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

    this.optionsChanged = true;
    this.setSelectedOptionsState(
      { readSpecificity: specificity },
      this.explicitApply ? undefined : this.updateHeatmap
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

  renderSubMenu(sticky) {
    return (
      <div style={sticky.style}>
        <div className="row sub-menu">
          <div className="col s3">{this.renderTaxonLevelPicker()}</div>
          <div className="col s3">{this.renderCategoryFilter()}</div>
          <div className="col s3">{this.renderMetricPicker()}</div>
          <div className="col s3">{this.renderBackgroundPicker()}</div>
        </div>
        <div className="row sub-menu">
          <div className="col s3">{this.renderAdvancedFilterPicker()}</div>
          <div className="col s3">{this.renderSpecificityFilter()}</div>
          <div className="col s2">{this.renderScalePicker()}</div>
          <div className="col s2">{this.renderTaxonsPerSampleSlider()}</div>
          <div className="col s2">{this.renderLegend()}</div>
        </div>
      </div>
    );
  }

  renderVisualization() {
    return (
      <StickyContainer>
        <Sticky>{this.renderSubMenu.bind(this)}</Sticky>
        <div className="row visualization-content">
          {this.state.loading && this.renderLoading()}
          {this.renderHeatmap()}
        </div>
      </StickyContainer>
    );
  }

  clusterData() {
    if (this.state.data && this.state.data.length) {
      this.clusteredSamples = this.clusterSamples(
        this.state.data,
        this.state.selectedOptions.metric,
        this.state.taxons.names
      );
      this.clusteredTaxons = this.clusterTaxons(
        this.state.data,
        this.state.selectedOptions.metric,
        this.state.taxons.names
      );
      this.minMax = this.getMinMax(this.state.taxons.names);
    }
  }

  render() {
    if (this.recluster) {
      this.clusterData();
      this.recluster = false;
    }

    return (
      <div id="project-visualization">
        <div className="heatmap-header">
          <Popup
            trigger={<PrimaryButton text="Share" onClick={this.onShareClick} />}
            content="A shareable URL has been copied to your clipboard!"
            on="click"
            hideOnScroll
          />
          <DownloadButton
            onClick={() => {
              location.href = this.downloadCurrentViewDataURL();
            }}
            disabled={!this.state.data}
          />
          {this.explicitApply && (
            <PrimaryButton
              text="Apply"
              onClick={this.onApplyClick.bind(this)}
              disabled={!this.optionsChanged}
            />
          )}
          <h2>
            Comparing {this.state.data ? this.state.data.length : ""} samples
          </h2>
        </div>
        {this.renderVisualization()}
      </div>
    );
  }
}

SamplesHeatmap.propTypes = {
  backgrounds: PropTypes.array,
  categories: PropTypes.array,
  explicitApply: PropTypes.bool,
  metrics: PropTypes.array,
  sampleIds: PropTypes.array,
  subcategories: PropTypes.object,
  taxonIds: PropTypes.array,
  taxonLevels: PropTypes.array,
  thresholdFilters: PropTypes.object
};

export default SamplesHeatmap;
