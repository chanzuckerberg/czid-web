import { find, unionBy, debounce } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import MultipleDropdown from "./MultipleDropdown";
const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;

class AsyncMultipleDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedOptions: [],
      options: [],
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.selectedOptions !== state.prevPropsSelectedOptions) {
      return {
        selectedOptions: props.selectedOptions,
        prevPropsSelectedOptions: props.selectedOptions,
        options: unionBy("value", state.options, props.selectedOptions),
      };
    }
    return null;
  }

  handleChange = selected => {
    const { selectedOptions } = this.state;
    const { onChange } = this.props;

    const selectedSet = new Set(selected);
    // remove if not in selected
    const newSelectedOptions = selectedOptions.filter(option =>
      selectedSet.has(option.value),
    );
    // get newly selected
    selectedOptions.forEach(option => selectedSet.delete(option.value));
    selectedSet.forEach(newSelectedValue => {
      const newOption = find({ value: newSelectedValue }, this.state.options);
      if (newOption) newSelectedOptions.push(newOption);
    });

    this.setState(
      {
        selectedOptions: newSelectedOptions,
      },
      () => onChange(this.state.selectedOptions),
    );
  };

  handleFilterChange = query => {
    this.loadOptionsForQuery(query);
  };

  // Debounce this function, so it only runs after the user has not typed for a delay.
  loadOptionsForQuery = debounce(AUTOCOMPLETE_DEBOUNCE_DELAY, async query => {
    this._lastQuery = query;
    const { onFilterChange } = this.props;
    const { selectedOptions } = this.state;
    let options = await onFilterChange(query);

    // If the query has since changed, discard the response (don't do anything).
    // Otherwise, update the state with the query response.
    if (query === this._lastQuery) {
      this.setState({ options: unionBy("value", options, selectedOptions) });
    }
  });

  render() {
    const { options, selectedOptions } = this.state;
    const {
      onFilterChange,
      selectedOptions: propsSelectedOptions,
      ...extraProps
    } = this.props;

    return (
      <MultipleDropdown
        {...extraProps}
        fluid
        hideCounter
        rounded
        search
        checkedOnTop
        onChange={this.handleChange}
        onFilterChange={this.handleFilterChange}
        options={options}
        value={selectedOptions.map(option => option.value)}
      />
    );
  }
}

AsyncMultipleDropdown.propTypes = {
  selectedOptions: PropTypes.array,
  onChange: PropTypes.func,
  onFilterChange: PropTypes.func,
};

AsyncMultipleDropdown.defaultProps = {
  selectedOptions: [],
};

export default AsyncMultipleDropdown;
