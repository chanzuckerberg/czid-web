import cx from "classnames";
import { isEmpty, isEqual, find, forEach, pick, reject } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";

import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
import {
  BaseMultipleFilter,
  BaseSingleFilter,
  LocationFilter,
  TaxonFilter,
} from "~/components/common/filters";
import TaxonThresholdFilter from "~/components/common/filters/TaxonThresholdFilter";
import ThresholdMap from "~/components/utils/ThresholdMap";
import { TAXON_THRESHOLD_FILTERING_FEATURE } from "~/components/utils/features";
import { WORKFLOWS } from "~/components/utils/workflows";
import FilterTag from "~ui/controls/FilterTag";
import {
  KEY_TAXON_SELECTED,
  KEY_TAXON_THRESHOLDS_SELECTED,
} from "../SampleView/constants";
import { DISCOVERY_DOMAIN_SNAPSHOT } from "./discovery_api";

import cs from "./discovery_filters.scss";

class DiscoveryFilters extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // taxon is an async dropdown and needs full options (value + label) to be stored
      // (otherwise we would need to load the labels from values)
      taxonSelected: this.props.taxonSelected,
      // for the remaining filters we can store values only
      locationSelected: this.props.locationSelected,
      timeSelected: this.props.timeSelected,
      visibilitySelected: this.props.visibilitySelected,
      hostSelected: this.props.hostSelected,
      tissueSelected: this.props.tissueSelected,
      taxonThresholdsSelected: this.props.taxonThresholdsSelected,
    };
  }

  static getDerivedStateFromProps(props, state) {
    let newState = state;
    forEach(
      key => {
        if (!state.prev || props[key] !== state.prev[key]) {
          newState.prev = newState.prev || {};
          newState[key] = props[key];
          newState.prev[key] = props[key];
        }
      },
      [
        "hostSelected",
        "locationSelected",
        "locationV2Selected",
        KEY_TAXON_SELECTED,
        KEY_TAXON_THRESHOLDS_SELECTED,
        "timeSelected",
        "tissueSelected",
        "visibilitySelected",
      ],
    );

    return newState;
  }

  notifyFilterChangeHandler = (callback = null) => {
    const { onFilterChange } = this.props;
    const selectedFilters = pick(
      [
        "hostSelected",
        "locationSelected",
        "locationV2Selected",
        KEY_TAXON_SELECTED,
        KEY_TAXON_THRESHOLDS_SELECTED,
        "timeSelected",
        "tissueSelected",
        "visibilitySelected",
      ],
      this.state,
    );

    onFilterChange &&
      onFilterChange({ selectedFilters, onFilterChangeCallback: callback });
  };

  handleTaxonThresholdFilterChange = (taxa, thresholds) => {
    const { domain } = this.props;
    const taxonFilterStateUpdate = {};

    // check if selected taxa changed
    if (!isEqual(this.state[KEY_TAXON_SELECTED], taxa)) {
      taxonFilterStateUpdate[KEY_TAXON_SELECTED] = taxa;
      trackEvent(
        `DiscoveryFilters_${KEY_TAXON_SELECTED.toLowerCase()}_changed`,
        {
          selectedKey: taxa,
        },
      );
    }

    // check if selected taxon thresholds were changed
    if (!isEqual(this.state[KEY_TAXON_THRESHOLDS_SELECTED], thresholds)) {
      taxonFilterStateUpdate[KEY_TAXON_THRESHOLDS_SELECTED] = thresholds;
      trackEvent(
        `DiscoveryFilters_${KEY_TAXON_THRESHOLDS_SELECTED.toLowerCase()}_changed`,
        {
          selectedKey: thresholds,
        },
      );
    }

    const callback = filteredSampleCount => {
      trackEvent(ANALYTICS_EVENT_NAMES.TAXON_THRESHOLD_FILTER_APPLY_CLICKED, {
        domain,
        selectedTaxa: taxa,
        thresholds,
        filteredSampleCount,
      });
    };

    this.setState(taxonFilterStateUpdate, () =>
      this.notifyFilterChangeHandler(callback),
    );
  };

  handleChange(selectedKey, selected) {
    const newState = [];
    newState[selectedKey] = selected;
    this.setState(newState, this.notifyFilterChangeHandler);
    trackEvent(`DiscoveryFilters_${selectedKey.toLowerCase()}_changed`, {
      selectedKey: selected,
    });
  }

  handleRemoveTag = ({ selectedKey, valueToRemove = "" }) => {
    let newSelected = null;
    let newState = {};

    if (Array.isArray(this.state[selectedKey])) {
      newSelected = this.state[selectedKey].filter(
        option => (option.value || option.id || option) !== valueToRemove,
      );

      // If all taxon filters have been removed, remove the threshold filters as well
      if (selectedKey === KEY_TAXON_SELECTED && isEmpty(newSelected)) {
        newState[KEY_TAXON_THRESHOLDS_SELECTED] = [];
      }
    }

    newState[selectedKey] = newSelected;
    this.setState(newState, this.notifyFilterChangeHandler);
  };

  renderTags(optionsKey) {
    let selectedKey = `${optionsKey}Selected`;
    let selectedOptions = this.state[selectedKey];
    let options = this.props[optionsKey];

    if (!selectedOptions) return;
    if (!Array.isArray(selectedOptions)) selectedOptions = [selectedOptions];

    const tags = selectedOptions
      // check if filter is on option format or just value (taxon are hashes with text and value)
      .map(option =>
        option.text
          ? option
          : find({ value: option }, options) || {
              text: option,
              value: option,
            },
      )
      // create the filter tag
      .map(option => {
        return (
          <FilterTag
            className={cs.filterTag}
            key={option.value}
            text={option.text}
            onClose={withAnalytics(
              () =>
                this.handleRemoveTag({
                  selectedKey,
                  valueToRemove: option.value,
                }),
              "DiscoveryFilters_tag_removed",
              {
                value: option.value,
                text: option.text,
              },
            )}
          />
        );
      });

    return <div className={cs.tags}>{tags}</div>;
  }

  renderTaxonFilterTags = () => {
    let selectedTaxa = this.state[KEY_TAXON_SELECTED];
    if (isEmpty(selectedTaxa)) return;

    return (
      <div className={cs.tags}>
        <div className={cs.descriptor}>Has at least one:</div>
        {selectedTaxa.map((selectedTaxon, i) => (
          <FilterTag
            className={cs.filterTag}
            key={`taxon_filter_tag_${selectedTaxon.id}`}
            text={selectedTaxon.name}
            onClose={withAnalytics(
              () =>
                this.handleRemoveTag({
                  selectedKey: KEY_TAXON_SELECTED,
                  valueToRemove: selectedTaxon.id,
                }),
              "DiscoveryFilters_tag_removed",
              {
                value: selectedTaxon.id,
                text: selectedTaxon.name,
              },
            )}
          />
        ))}
      </div>
    );
  };

  handleRemoveThresholdFilterTag = threshold => {
    const filteredThresholds = reject(
      threshold,
      this.state[KEY_TAXON_THRESHOLDS_SELECTED],
    );
    const newState = { [KEY_TAXON_THRESHOLDS_SELECTED]: filteredThresholds };

    this.setState(newState, this.notifyFilterChangeHandler);
  };

  renderTaxonThresholdFilterTags = () => {
    let selectedThresholds = this.state[KEY_TAXON_THRESHOLDS_SELECTED];
    if (isEmpty(selectedThresholds)) return;

    return (
      <div className={cs.tags}>
        <div className={cs.descriptor}>Meets all:</div>
        {selectedThresholds.map((threshold, i) => (
          <ThresholdFilterTag
            className={cs.filterTag}
            key={`threshold_filter_tag_${i}`}
            threshold={threshold}
            onClose={() => this.handleRemoveThresholdFilterTag(threshold)}
          />
        ))}
      </div>
    );
  };

  render() {
    const {
      hostSelected,
      locationV2Selected,
      taxonSelected,
      taxonThresholdsSelected,
      timeSelected,
      tissueSelected,
      visibilitySelected,
    } = this.state;

    const {
      allowedFeatures,
      className,
      domain,
      host,
      locationV2,
      time,
      tissue,
      visibility,
      workflow,
    } = this.props;

    const hasTaxonThresholdFilterFeature = allowedFeatures.includes(
      TAXON_THRESHOLD_FILTERING_FEATURE,
    );

    return (
      <div className={cx(cs.filtersContainer, className)}>
        {/* TODO(ihan): enable taxon and location filter for snapshot view */}
        {domain !== DISCOVERY_DOMAIN_SNAPSHOT && (
          <>
            <div
              className={cx(
                cs.filterContainer,
                hasTaxonThresholdFilterFeature &&
                  cs.taxonThresholdFilterContainer,
              )}
            >
              {hasTaxonThresholdFilterFeature ? (
                <TaxonThresholdFilter
                  domain={domain}
                  onFilterApply={(taxa, thresholds) => {
                    const validThresholds = thresholds?.filter(
                      ThresholdMap.isThresholdValid,
                    );
                    this.handleTaxonThresholdFilterChange(
                      taxa,
                      validThresholds,
                    );
                  }}
                  selectedOptions={taxonSelected}
                  selectedThresholds={taxonThresholdsSelected}
                  disabled={workflow === WORKFLOWS.CONSENSUS_GENOME.value}
                />
              ) : (
                <TaxonFilter
                  domain={domain}
                  onChange={this.handleChange.bind(this, KEY_TAXON_SELECTED)}
                  selectedOptions={taxonSelected}
                  disabled={workflow === WORKFLOWS.CONSENSUS_GENOME.value}
                />
              )}
              {workflow !== WORKFLOWS.CONSENSUS_GENOME.value && (
                <>
                  {!hasTaxonThresholdFilterFeature && this.renderTags("taxon")}
                  {hasTaxonThresholdFilterFeature &&
                    this.renderTaxonFilterTags()}
                  {hasTaxonThresholdFilterFeature &&
                    this.renderTaxonThresholdFilterTags()}
                </>
              )}
            </div>
            {hasTaxonThresholdFilterFeature && <div className={cs.divider} />}
            <div className={cs.filterContainer}>
              <LocationFilter
                onChange={this.handleChange.bind(this, "locationV2Selected")}
                selected={
                  locationV2 && locationV2.length ? locationV2Selected : null
                }
                options={locationV2}
                label="Location"
              />
              {this.renderTags("locationV2")}
            </div>
          </>
        )}
        <div className={cs.filterContainer}>
          <BaseSingleFilter
            label="Timeframe"
            options={time}
            onChange={this.handleChange.bind(this, "timeSelected")}
            value={time && !!time.length ? timeSelected : null}
          />
          {this.renderTags("time")}
        </div>
        {domain !== DISCOVERY_DOMAIN_SNAPSHOT && (
          <div className={cs.filterContainer}>
            <BaseSingleFilter
              label="Visibility"
              options={visibility}
              onChange={this.handleChange.bind(this, "visibilitySelected")}
              value={
                visibility && visibility.length ? visibilitySelected : null
              }
            />
            {this.renderTags("visibility")}
          </div>
        )}
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "hostSelected")}
            selected={host && host.length ? hostSelected : null}
            options={host}
            label="Host"
          />
          {this.renderTags("host")}
        </div>
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "tissueSelected")}
            selected={tissue && tissue.length ? tissueSelected : null}
            options={tissue}
            label="Sample Type"
          />
          {this.renderTags("tissue")}
        </div>
      </div>
    );
  }
}

DiscoveryFilters.defaultProps = {
  host: [],
  location: [],
  locationV2: [],
  time: [],
  tissue: [],
  visibility: [],
};

DiscoveryFilters.propTypes = {
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
  domain: PropTypes.string,
  workflow: PropTypes.string,

  // Filter options and counters
  host: PropTypes.array,
  location: PropTypes.array,
  locationV2: PropTypes.array,
  time: PropTypes.array,
  tissue: PropTypes.array,
  visibility: PropTypes.array,

  // Selected values
  hostSelected: PropTypes.array,
  locationSelected: PropTypes.array,
  locationV2Selected: PropTypes.array,
  taxonSelected: PropTypes.array,
  taxonThresholdsSelected: PropTypes.array,
  timeSelected: PropTypes.string,
  tissueSelected: PropTypes.array,
  visibilitySelected: PropTypes.string,

  onFilterChange: PropTypes.func,
};

export default DiscoveryFilters;
