import React from "react";
import PropTypes from "prop-types";
import { find, forEach, pick } from "lodash/fp";
import {
  BaseMultipleFilter,
  BaseSingleFilter,
  TaxonFilter
} from "~/components/common/filters";
import FilterTag from "~ui/controls/FilterTag";
import cs from "./discovery_filters.scss";
import cx from "classnames";

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
      tissueSelected: this.props.tissueSelected
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
        "taxonSelected",
        "timeSelected",
        "tissueSelected",
        "visibilitySelected"
      ]
    );

    return newState;
  }

  notifyFilterChangeHandler = () => {
    const { onFilterChange } = this.props;
    const selected = pick(
      [
        "hostSelected",
        "locationSelected",
        "taxonSelected",
        "timeSelected",
        "tissueSelected",
        "visibilitySelected"
      ],
      this.state
    );
    onFilterChange && onFilterChange(selected);
  };

  handleChange(selectedKey, selected) {
    const newState = [];
    newState[selectedKey] = selected;
    this.setState(newState, this.notifyFilterChangeHandler);
  }

  handleRemoveTag(selectedKey, removedValue) {
    let newSelected = null;
    if (Array.isArray(this.state[selectedKey])) {
      newSelected = this.state[selectedKey].filter(
        option => (option.value || option) !== removedValue
      );
    }

    let newState = {};
    newState[selectedKey] = newSelected;
    this.setState(newState, this.notifyFilterChangeHandler);
  }

  renderTags(optionsKey) {
    let selectedKey = `${optionsKey}Selected`;
    let selectedOptions = this.state[selectedKey];
    let options = this.props[optionsKey];

    if (!selectedOptions) return;
    if (!Array.isArray(selectedOptions)) selectedOptions = [selectedOptions];
    return (
      selectedOptions
        // check if filter is on option format or just value (taxon are hashes with text and value)
        .map(
          option => (option.text ? option : find({ value: option }, options))
        )
        // filter out options that do not exist in the dropdown (although this should be avoided, option might have been chosen in another component)
        .filter(option => option)
        // create the filter tag
        .map(option => {
          return (
            <FilterTag
              className={cs.filterTag}
              key={option.value}
              text={option.text}
              onClose={this.handleRemoveTag.bind(
                this,
                selectedKey,
                option.value
              )}
            />
          );
        })
    );
  }

  render() {
    const {
      hostSelected,
      locationSelected,
      taxonSelected,
      timeSelected,
      tissueSelected,
      visibilitySelected
    } = this.state;

    const { className, host, location, time, tissue, visibility } = this.props;

    return (
      <div className={cx(cs.filtersContainer, className)}>
        <div className={cs.filterContainer}>
          <TaxonFilter
            onChange={this.handleChange.bind(this, "taxonSelected")}
            selected={taxonSelected}
          />
          {this.renderTags("taxon")}
        </div>
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "locationSelected")}
            selected={location && location.length ? locationSelected : null}
            options={location}
            label="Location"
          />
          {this.renderTags("location")}
        </div>
        <div className={cs.filterContainer}>
          <BaseSingleFilter
            label="Timeframe"
            options={time}
            onChange={this.handleChange.bind(this, "timeSelected")}
            value={time && !!time.length ? timeSelected : null}
          />
          {this.renderTags("time")}
        </div>
        <div className={cs.filterContainer}>
          <BaseSingleFilter
            label="Visibility"
            options={visibility}
            onChange={this.handleChange.bind(this, "visibilitySelected")}
            value={visibility && visibility.length ? visibilitySelected : null}
          />
          {this.renderTags("visibility")}
        </div>
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
            label="Tissue"
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
  time: [],
  tissue: [],
  visibility: []
};

DiscoveryFilters.propTypes = {
  className: PropTypes.string,

  // Filter options and counters
  host: PropTypes.array,
  location: PropTypes.array,
  time: PropTypes.array,
  tissue: PropTypes.array,
  visibility: PropTypes.array,

  // Selected values
  hostSelected: PropTypes.array,
  locationSelected: PropTypes.array,
  taxonSelected: PropTypes.array,
  timeSelected: PropTypes.string,
  tissueSelected: PropTypes.array,
  visibilitySelected: PropTypes.string,

  onFilterChange: PropTypes.func
};

export default DiscoveryFilters;
