import React from "react";
import PropTypes from "prop-types";
import { find, unionBy } from "lodash/fp";
import MultipleDropdown from "./MultipleDropdown";

class AsyncMultipleDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedOptions: [],
      options: []
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.selectedOptions !== state.prevPropsSelectedOptions) {
      return {
        selectedOptions: props.selectedOptions,
        prevPropsSelectedOptions: props.selectedOptions,
        options: unionBy("value", state.options, props.selectedOptions)
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
      selectedSet.has(option.value)
    );
    // get newly selected
    selectedOptions.forEach(option => selectedSet.delete(option.value));
    selectedSet.forEach(newSelectedValue => {
      const newOption = find({ value: newSelectedValue }, this.state.options);
      if (newOption) newSelectedOptions.push(newOption);
    });

    this.setState(
      {
        selectedOptions: newSelectedOptions
      },
      () => onChange(this.state.selectedOptions)
    );
  };

  handleFilterChange = async query => {
    const { onFilterChange } = this.props;
    const { selectedOptions } = this.state;
    let options = await onFilterChange(query);

    this.setState({ options: unionBy("value", options, selectedOptions) });
  };

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
  onFilterChange: PropTypes.func
};

export default AsyncMultipleDropdown;
