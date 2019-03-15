import React from "react";
import PropTypes from "prop-types";
import {
  BaseMultipleFilter,
  BaseSingleFilter,
  TaxonFilter,
  TimeFilter
} from "~/components/common/filters";
import FilterTag from "~ui/controls/FilterTag";
import cs from "./discovery_filters.scss";
import cx from "classnames";

class DiscoveryFilters extends React.Component {
  constructor(props) {
    super(props);

    // TODO(tiago): refactor to store only values (not options)
    this.state = {
      taxonSelected: [],
      locationSelected: [],
      timeSelected: null,
      visibilitySelected: null,
      hostSelected: [],
      tissueSelected: []
    };
  }

  // componentDidUpdate() {
  //   console.log("DiscoveryFilters:componentDidUpdate - props=", this.props);
  // }

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
        option => option.value !== removedValue
      );
    }

    let newState = {};
    newState[selectedKey] = newSelected;
    this.setState(newState, () => onFilterChange && onFilterChange(this.state));
  }

  renderTags(optionsKey) {
    let options = this.state[optionsKey];

    if (!options) return;
    if (!Array.isArray(options)) options = [options];

    return options.map(option => (
      <FilterTag
        className={cs.filterTag}
        key={option.value}
        text={option.text}
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

    const { className, host, location, time, tissue, visibility } = this.props;

    return (
      <div className={cx(cs.filtersContainer, className)}>
        <div className={cs.filterContainer}>
          <TaxonFilter
            onChange={this.handleChange.bind(this, "taxonSelected")}
            selected={taxonSelected}
          />
          {this.renderTags("taxonSelected")}
        </div>
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "locationSelected")}
            selected={locationSelected}
            options={location}
            label="Location"
          />
          {this.renderTags("locationSelected")}
        </div>
        <div className={cs.filterContainer}>
          <TimeFilter
            onChange={this.handleChange.bind(this, "timeSelected")}
            selected={timeSelected}
            options={time}
          />
          {this.renderTags("timeSelected")}
        </div>
        <div className={cs.filterContainer}>
          <BaseSingleFilter
            label="Visibility"
            options={visibility}
            onChange={this.handleChange.bind(this, "visibilitySelected")}
            value={visibilitySelected}
          />
          {this.renderTags("visibilitySelected")}
        </div>
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "hostSelected")}
            selected={hostSelected}
            options={host}
            label="Host"
          />
          {this.renderTags("hostSelected")}
        </div>
        <div className={cs.filterContainer}>
          <BaseMultipleFilter
            onChange={this.handleChange.bind(this, "tissueSelected")}
            selected={tissueSelected}
            options={tissue}
            label="Tissue"
          />
          {this.renderTags("tissueSelected")}
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
  onFilterChange: PropTypes.func,

  // Filter options and counters
  host: PropTypes.array,
  location: PropTypes.array,
  time: PropTypes.array,
  tissue: PropTypes.array,
  visibility: PropTypes.array
};

export default DiscoveryFilters;
