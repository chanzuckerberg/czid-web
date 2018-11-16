import React from "react";
import axios from "axios";
import queryString from "query-string";
import { Popup } from "semantic-ui-react";
import copy from "copy-to-clipboard";
import { StickyContainer, Sticky } from "react-sticky";
import Dropdown from "../../ui/controls/dropdowns/Dropdown";
import ErrorBoundary from "../../ErrorBoundary";
import SamplesHeatmapVis from "./SamplesHeatmapVis";
import MultipleNestedDropdown from "../../ui/controls/dropdowns/MultipleNestedDropdown";
import PrimaryButton from "../../ui/controls/buttons/PrimaryButton";
import SampleDetailsSidebar from "../report/SampleDetailsSidebar";
import PropTypes from "prop-types";
import Slider from "../../ui/controls/Slider";
import ThresholdFilterDropdown from "../../ui/controls/dropdowns/ThresholdFilterDropdown";
import DeepEqual from "fast-deep-equal";
import NarrowContainer from "../../layout/NarrowContainer.jsx";
import SequentialLegendVis from "../../visualizations/legends/SequentialLegendVis.jsx";
import { min, max } from "lodash/fp";
import ViewHeader from "../../layout/ViewHeader/ViewHeader";
import Divider from "../../layout/Divider.jsx";
import cs from "./samples_heatmap_view.scss";
import DownloadButtonDropdown from "../../ui/controls/dropdowns/DownloadButtonDropdown.jsx";

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

    this.handleRemoveTaxon = this.handleRemoveTaxon.bind(this);
    this.handleSampleLabelClick = this.handleSampleLabelClick.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
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

  onShareClick() {
    copy(this.getUrlForCurrentParams());
  }

  metricToSortField(metric) {
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
      })
      .then(response => {
        let newState = this.extractData(response.data);
        newState.loading = false;
        window.history.replaceState("", "", this.getUrlForCurrentParams());
        this.setState(newState);
      })
      .catch(thrown => {
        // TODO: process error if not cancelled request by client: if (!axios.isCancel(thrown) {
      });
  }

  extractData(rawData) {
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
        index: i
      };
      sampleDetails[sample.name] = sampleDetails[sample.sample_id];
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
          data[metric.value][taxonIndex] = data[metric.value][taxonIndex] || [];
          data[metric.value][taxonIndex][i] = taxon[metricType][metricName];
        });
      }
    }

    return {
      sampleIds,
      sampleDetails,
      taxonIds,
      taxonDetails,
      data
    };
  }

  renderLoading() {
    return (
      <p className={cs.loadingIndicator}>
        <i className="fa fa-spinner fa-pulse fa-fw" />
        Loading for {this.state.sampleIds.length} samples...
      </p>
    );
  }

  handleRemoveTaxon(taxonName) {
    let taxonId = this.state.taxonDetails[taxonName].id;
    this.removedTaxonIds.add(taxonId);
  }

  handleSampleLabelClick(sampleName) {
    let sampleId = this.state.sampleDetails[sampleName].id;
    if (this.state.sidebarVisible && this.state.selectedSampleId === sampleId) {
      this.handleSidebarClose();
    } else {
      this.setState({
        selectedSampleId: sampleId,
        sidebarVisible: true
      });
    }
  }

  handleSidebarClose = () => {
    this.setState({
      sidebarVisible: false
    });
  };

  renderLegend() {
    if (
      this.state.loading ||
      !this.state.data ||
      !this.state.data[this.state.selectedOptions.metric].length
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
      Object.values(this.state.data).every(e => !e.length)
    ) {
      return;
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
        label="Metric:"
        disabled={!this.state.data}
      />
    );
  }

  onThresholdFilterApply(filters) {
    if (DeepEqual(filters, this.state.selectedOptions.thresholdFilters)) {
      return;
    }

    this.setSelectedOptionsState(
      { thresholdFilters: filters },
      this.updateHeatmap
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

  onApplyClick() {
    this.updateHeatmap();
  }

  updateHeatmap() {
    this.fetchDataFromServer();
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
        label="Background:"
        disabled={!this.state.data}
      />
    );
  }

  onTaxonsPerSampleEnd(newValue) {
    this.setSelectedOptionsState(
      { taxonsPerSample: newValue },
      this.updateHeatmap
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

  renderSubMenu(sticky) {
    return (
      <div style={sticky.style} className={cs.menu}>
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
      <StickyContainer>
        <Sticky>{this.renderSubMenu.bind(this)}</Sticky>
        <div className="row visualization-content">
          {this.state.loading && this.renderLoading()}
          {this.renderHeatmap()}
        </div>
      </StickyContainer>
    );
  }

  handleDownloadClick(fileType) {
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
  }

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
        <NarrowContainer>{this.renderVisualization()}</NarrowContainer>
        <SampleDetailsSidebar
          showReportLink
          visible={this.state.sidebarVisible}
          onClose={this.handleSidebarClose}
          sampleId={this.state.selectedSampleId}
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
