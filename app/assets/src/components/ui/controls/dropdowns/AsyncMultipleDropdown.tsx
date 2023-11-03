import { debounce, find, unionBy } from "lodash/fp";
import React from "react";
import MultipleDropdown from "./MultipleDropdown";
const AUTOCOMPLETE_DEBOUNCE_DELAY = 200;

interface AsyncMultipleDropdownProps {
  selectedOptions?: $TSFixMe[];
  onChange?: $TSFixMeFunction;
  onFilterChange?: $TSFixMeFunction;
}

class AsyncMultipleDropdown extends React.Component<AsyncMultipleDropdownProps> {
  _lastQuery: $TSFixMe;
  constructor(props: AsyncMultipleDropdownProps) {
    super(props);

    this.state = {
      selectedOptions: [],
      options: [],
    };
  }

  static getDerivedStateFromProps(
    props: AsyncMultipleDropdownProps,
    state: $TSFixMe,
  ) {
    if (props.selectedOptions !== state.prevPropsSelectedOptions) {
      return {
        selectedOptions: props.selectedOptions,
        prevPropsSelectedOptions: props.selectedOptions,
        options: unionBy("value", state.options, props.selectedOptions),
      };
    }
    return null;
  }

  handleChange = (selected: $TSFixMe) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
    const { selectedOptions } = this.state;
    const { onChange } = this.props;

    const selectedSet = new Set(selected);
    // remove if not in selected
    const newSelectedOptions = selectedOptions.filter((option: $TSFixMe) =>
      selectedSet.has(option.value),
    );
    // get newly selected
    selectedOptions.forEach((option: $TSFixMe) =>
      selectedSet.delete(option.value),
    );
    selectedSet.forEach(newSelectedValue => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'options' does not exist on type 'Readonl... Remove this comment to see the full error message
      const newOption = find({ value: newSelectedValue }, this.state.options);
      if (newOption) newSelectedOptions.push(newOption);
    });

    this.setState(
      {
        selectedOptions: newSelectedOptions,
      },
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
      () => onChange(this.state.selectedOptions),
    );
  };

  handleFilterChange = (query: $TSFixMe) => {
    this.loadOptionsForQuery(query);
  };

  // Debounce this function, so it only runs after the user has not typed for a delay.
  loadOptionsForQuery = debounce(AUTOCOMPLETE_DEBOUNCE_DELAY, async query => {
    this._lastQuery = query;
    const { onFilterChange } = this.props;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
    const { selectedOptions } = this.state;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    const options = await onFilterChange(query);

    // If the query has since changed, discard the response (don't do anything).
    // Otherwise, update the state with the query response.
    if (query === this._lastQuery) {
      // @ts-expect-error Property 'length' is missing in type '{}'
      this.setState({ options: unionBy("value", options, selectedOptions) });
    }
  });

  render() {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'options' does not exist on type 'Readonl... Remove this comment to see the full error message
    const { options, selectedOptions } = this.state;
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onFilterChange,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        value={selectedOptions.map((option: $TSFixMe) => option.value)}
      />
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
AsyncMultipleDropdown.defaultProps = {
  selectedOptions: [],
};

export default AsyncMultipleDropdown;
