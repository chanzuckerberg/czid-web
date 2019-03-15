import React from "react";
import PropTypes from "prop-types";
import { endsWith, find, pickBy, some } from "lodash/fp";
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

  componentDidMount() {
    console.log("DiscoveryFilters:componentDidMount - props", this.props);
    console.log("DiscoveryFilters:componentDidMount - state", this.state);
  }

  componentDidUpdate() {
    console.log("DiscoveryFilters:componentDidUpdate - props", this.props);
    console.log("DiscoveryFilters:componentDidUpdate - state", this.state);
    const selected = pickBy(
      (key, value) => endsWith("Selected", key) && value !== this.props[key],
      this.state
    );
    console.log(
      "DiscoveryFilters:componentDidUpdate - diff selected",
      selected
    );

    // const changed = some(
    //   key => this.state[`${key}Selected`] !== this.props[`${key}Selected`],
    //   ["taxon", "location", "time", "visibility", "host", "tissue"]
    // );
    // if (changed) {
    //   console.log("DiscoveryFilters:componentDidUpdate - updating state");
    //   this.setState(filter(prop => prop.this.props);
    // }
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
    let selectedOptions = this.state[`${optionsKey}Selected`];
    let options = this.props[optionsKey];

    if (!selectedOptions) return;
    if (!Array.isArray(selectedOptions)) selectedOptions = [selectedOptions];
    console.log(optionsKey, selectedOptions, options, this.props);
    return selectedOptions.map(option => (
      <FilterTag
        className={cs.filterTag}
        key={option.value || option}
        text={option.text || find({ value: option }, options).text}
        onClose={this.handleRemoveTag.bind(this, optionsKey, option.value)}
      />
    ));
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
