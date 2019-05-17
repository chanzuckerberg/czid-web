import React from "react";
import PropTypes from "prop-types";
import { isEqual, min, max } from "lodash/fp";

import {
  Dropdown,
  MultipleNestedDropdown,
  ThresholdFilterDropdown
} from "~ui/controls/dropdowns";
import { Divider } from "~/components/layout";
import { logAnalyticsEvent } from "~/api/analytics";
import Slider from "~ui/controls/Slider";
import SequentialLegendVis from "~/components/visualizations/legends/SequentialLegendVis.jsx";

import cs from "./samples_heatmap_view.scss";

export default class SamplesHeatmapControls extends React.Component {
  onTaxonLevelChange = taxonLevel => {
    if (this.props.selectedOptions.species === taxonLevel) {
      return;
    }

    this.props.onSelectedOptionsChange({ species: taxonLevel });
    logAnalyticsEvent("SamplesHeatmapControls_taxon-level-select_changed", {
      taxonLevel
    });
  };

  renderTaxonLevelSelect() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.props.options.taxonLevels}
        value={this.props.selectedOptions.species}
        onChange={this.onTaxonLevelChange}
        label="Taxon Level"
        disabled={!this.props.data}
      />
    );
  }

  onCategoryChange = (categories, subcategories) => {
    this.props.onSelectedOptionsChange({ categories, subcategories });
    logAnalyticsEvent("SamplesHeatmapControls_category-filter_changed", {
      categories: categories.length,
      subcategories: subcategories.length
    });
  };

  renderCategoryFilter() {
    let options = this.props.options.categories.map(category => {
      let option = { text: category, value: category };
      let subcategories = this.props.options.subcategories[category];
      if (Array.isArray(subcategories)) {
        option.suboptions = subcategories.map(subcategory => {
          return { text: subcategory, value: subcategory };
        });
      }
      return option;
    });

    return (
      <MultipleNestedDropdown
        boxed
        fluid
        rounded
        options={options}
        onChange={this.onCategoryChange}
        selectedOptions={this.props.selectedOptions.categories}
        selectedSuboptions={this.props.selectedOptions.subcategories}
        label="Taxon Categories"
        disabled={!this.props.data}
      />
    );
  }

  onMetricChange = metric => {
    if (metric === this.props.selectedOptions.metric) {
      return;
    }

    this.props.onSelectedOptionsChange({ metric });
    logAnalyticsEvent("SamplesHeatmapControls_metric-select_changed", {
      metric
    });
  };

  renderMetricSelect() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.props.options.metrics}
        onChange={this.onMetricChange}
        value={this.props.selectedOptions.metric}
        label="Metric"
        disabled={!this.props.data}
      />
    );
  }

  onBackgroundChange = background => {
    if (background == this.props.selectedOptions.background) {
      return;
    }

    this.props.onSelectedOptionsChange({ background });
    logAnalyticsEvent("SamplesHeatmapControls_background-select_changed", {
      background
    });
  };

  renderBackgroundSelect() {
    let options = this.props.options.backgrounds.map(background => ({
      text: background.name,
      value: background.value
    }));

    return (
      <Dropdown
        fluid
        rounded
        options={options}
        onChange={this.onBackgroundChange}
        value={this.props.selectedOptions.background}
        label="Background"
        disabled={!this.props.data}
      />
    );
  }

  onThresholdFilterApply = filters => {
    if (isEqual(filters, this.props.selectedOptions.thresholdFilters)) {
      return;
    }

    this.props.onSelectedOptionsChange({ thresholdFilters: filters });
    logAnalyticsEvent(
      "SamplesHeatmapControls_threshold-filter-select_applied",
      {
        filters: filters.length
      }
    );
  };

  renderThresholdFilterSelect() {
    return (
      <ThresholdFilterDropdown
        options={this.props.options.thresholdFilters}
        thresholds={this.props.selectedOptions.thresholdFilters}
        onApply={this.onThresholdFilterApply}
        disabled={!this.props.data}
      />
    );
  }

  onSpecificityChange = specificity => {
    if (specificity === this.props.selectedOptions.readSpecificity) {
      return;
    }

    this.props.onSelectedOptionsChange({ readSpecificity: specificity });
    logAnalyticsEvent("SamplesHeatmapControls_specificity-filter_changed", {
      readSpecificity: specificity
    });
  };

  renderSpecificityFilter() {
    return (
      <Dropdown
        fluid
        rounded
        options={this.props.options.specificityOptions}
        value={this.props.selectedOptions.readSpecificity}
        label="Read Specificity"
        onChange={this.onSpecificityChange}
        disabled={!this.props.data}
      />
    );
  }

  onDataScaleChange = scaleIdx => {
    if (scaleIdx == this.props.selectedOptions.dataScaleIdx) {
      return;
    }

    this.props.onSelectedOptionsChange({ dataScaleIdx: scaleIdx });
    logAnalyticsEvent("SamplesHeatmapControls_data-scale-select_changed", {
      dataScaleIdx: scaleIdx
    });
  };

  renderScaleSelect() {
    let options = this.props.options.scales.map((scale, index) => ({
      text: scale[0],
      value: index
    }));

    return (
      <Dropdown
        fluid
        rounded
        value={this.props.selectedOptions.dataScaleIdx}
        onChange={this.onDataScaleChange}
        options={options}
        label="Scale"
        disabled={!this.props.data}
      />
    );
  }

  onTaxonsPerSampleEnd = newValue => {
    this.props.onSelectedOptionsChange({ taxonsPerSample: newValue });
    logAnalyticsEvent(
      "SamplesHeatmapControls_taxons-per-sample-slider_changed",
      {
        taxonsPerSample: newValue
      }
    );
  };

  renderTaxonsPerSampleSlider() {
    return (
      <Slider
        label="Taxa per Sample: "
        min={this.props.options.taxonsPerSample.min}
        max={this.props.options.taxonsPerSample.max}
        value={this.props.selectedOptions.taxonsPerSample}
        onAfterChange={this.onTaxonsPerSampleEnd}
      />
    );
  }

  renderLegend() {
    if (
      this.props.loading ||
      !this.props.data ||
      !(this.props.data[this.props.selectedOptions.metric] || []).length
    ) {
      return;
    }
    let values = this.props.data[this.props.selectedOptions.metric];
    let scaleIndex = this.props.selectedOptions.dataScaleIdx;
    return (
      <SequentialLegendVis
        min={Math.max(0, min(values.map(array => min(array))))}
        max={max(values.map(array => max(array)))}
        scale={this.props.options.scales[scaleIndex][1]}
      />
    );
  }

  render() {
    return (
      <div className={cs.menu}>
        <Divider />
        <div className={`${cs.filterRow} row`}>
          <div className="col s3">{this.renderTaxonLevelSelect()}</div>
          <div className="col s3">{this.renderCategoryFilter()}</div>
          <div className="col s3">{this.renderMetricSelect()}</div>
          <div className="col s3">{this.renderBackgroundSelect()}</div>
        </div>
        <div className={`${cs.filterRow} row`}>
          <div className="col s3">{this.renderThresholdFilterSelect()}</div>
          <div className="col s3">{this.renderSpecificityFilter()}</div>
          <div className="col s2">{this.renderScaleSelect()}</div>
          <div className="col s2">{this.renderTaxonsPerSampleSlider()}</div>
          <div className="col s2">{this.renderLegend()}</div>
        </div>
        <Divider />
      </div>
    );
  }
}

SamplesHeatmapControls.propTypes = {
  options: PropTypes.shape({
    metrics: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        value: PropTypes.string
      })
    ),
    categories: PropTypes.arrayOf(PropTypes.string),
    subcategories: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
    backgrounds: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        value: PropTypes.number
      })
    ),
    taxonLevels: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        value: PropTypes.number
      })
    ),
    specificityOptions: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        value: PropTypes.number
      })
    ),
    thresholdFilters: PropTypes.shape({
      operators: PropTypes.arrayOf(PropTypes.string),
      targets: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          value: PropTypes.string
        })
      )
    }),
    scales: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    taxonsPerSample: PropTypes.objectOf(PropTypes.number)
  }),
  selectedOptions: PropTypes.shape({
    species: PropTypes.number,
    categories: PropTypes.arrayOf(PropTypes.string),
    subcategories: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
    metric: PropTypes.string,
    background: PropTypes.number,
    thresholdFilters: PropTypes.arrayOf(
      PropTypes.shape({
        metric: PropTypes.string,
        value: PropTypes.string,
        operator: PropTypes.string
      })
    ),
    readSpecificity: PropTypes.number,
    dataScaleIdx: PropTypes.number,
    taxonsPerSample: PropTypes.number
  }),
  onSelectedOptionsChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  data: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
  )
};
