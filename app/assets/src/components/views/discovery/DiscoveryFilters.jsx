import React from "react";
import PropTypes from "prop-types";
import { capitalize, endsWith, find, forEach, keys } from "lodash/fp";
import {
  BaseMultipleFilter,
  BaseSingleFilter,
  TaxonFilter,
  TimeFilter
} from "~/components/common/filters";
import FilterTag from "~ui/controls/FilterTag";
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
      tissueSelected: this.props.tissueSelected
    };
  }

  static getDerivedStateFromProps(props, state) {
    let newState = state;
    forEach(key => {
      const value = props[key];
      if (
        endsWith("Selected", key) &&
        value !== state[`prev${capitalize(key)}`]
      ) {
        newState[key] = value;
        newState[`prev${capitalize(key)}`] = value;
      }
    }, keys(props));

    return newState;
  }

  handleChange(selectedKey, selected) {
    const { onFilterChange } = this.props;

    const newState = [];
    newState[selectedKey] = selected;
    this.setState(newState, () => onFilterChange && onFilterChange(this.state));
  }

  handleRemoveTag(selectedKey, removedValue) {
    const { onFilterChange } = this.props;

    let newSelected = null;
    if (Array.isArray(this.state[selectedKey])) {
      newSelected = this.state[selectedKey].filter(
        option => (option.value || option) !== removedValue
      );
    }

    let newState = {};
    newState[selectedKey] = newSelected;
    this.setState(newState, () => onFilterChange && onFilterChange(this.state));
  }

  renderTags(optionsKey) {
    let selectedKey = `${optionsKey}Selected`;
    let selectedOptions = this.state[selectedKey];
    let options = this.props[optionsKey];

    if (!selectedOptions) return;
    if (!Array.isArray(selectedOptions)) selectedOptions = [selectedOptions];
    return selectedOptions.map(option => {
      return (
        <FilterTag
          className={cs.filterTag}
          key={option.value || option}
          text={option.text || find({ value: option }, options).text}
          onClose={this.handleRemoveTag.bind(
            this,
            selectedKey,
            option.value || option
          )}
        />
      );
    });
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

    const { host, location, time, tissue, visibility } = this.props;

    return (
      <div className={cs.filtersContainer}>
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
            selected={locationSelected}
            options={location}
            label="Location"
          />
          {this.renderTags("location")}
        </div>
        <div className={cs.filterContainer}>
          <TimeFilter
            onChange={this.handleChange.bind(this, "timeSelected")}
            selected={timeSelected}
            options={time}
          />
          {this.renderTags("time")}
        </div>
        <div className={cs.filterContainer}>
          <BaseSingleFilter
            label="Visibility"
            options={visibility}
            onChange={this.handleChange.bind(this, "visibilitySelected")}
            value={visibilitySelected}
          />
          {this.renderTags("visibility")}
        </div>
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "hostSelected")}
            selected={hostSelected}
            options={host}
            label="Host"
          />
          {this.renderTags("host")}
        </div>
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "tissueSelected")}
            selected={tissueSelected}
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
