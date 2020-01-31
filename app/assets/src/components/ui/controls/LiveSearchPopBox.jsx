import React from "react";
import PropTypes from "prop-types";
import Input from "~ui/controls/Input";
import { BareDropdown } from "~ui/controls/dropdowns";
import { forEach, sumBy, values } from "lodash/fp";
import cx from "classnames";
import cs from "./live_search_pop_box.scss";

class LiveSearchPopBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      results: [],
      // the current value of the search input
      inputValue: this.props.initialValue,
    };

    this.lastestTimerId = null;
  }

  static getDerivedStateFromProps(props, state) {
    // If the value has changed, reset the input value.
    // Store the prevValue to detect whether the value has changed.
    if (props.value !== state.prevValue) {
      return {
        prevValue: props.value,
        inputValue: props.value,
      };
    }
    return null;
  }

  handleKeyDown = keyEvent => {
    const { onEnter, inputMode } = this.props;
    const { inputValue } = this.state;

    // Pressing enter selects what they currently typed.
    if (keyEvent.key === "Enter") {
      if (inputMode) {
        this.handleResultSelect({ result: inputValue });
      }
      onEnter && onEnter({ current: keyEvent, value: inputValue });
    }
  };

  handleResultSelect = ({ currentEvent, result }) => {
    const { onResultSelect } = this.props;
    onResultSelect && onResultSelect({ currentEvent, result });
    this.closeDropdown();
  };

  closeDropdown = () => {
    this.setState({
      isLoading: false,
      focus: false,
    });
  };

  triggerSearch = async () => {
    const { onSearchTriggered } = this.props;
    const { inputValue } = this.state;

    this.setState({ isLoading: true, focus: true });

    const timerId = this.lastestTimerId;
    const results = await onSearchTriggered(inputValue);

    if (timerId === this.lastestTimerId) {
      this.setState({
        isLoading: false,
        results: results,
      });
    }
  };

  handleSearchChange = value => {
    const { delayTriggerSearch, minChars, onSearchChange } = this.props;
    this.setState({
      inputValue: value,
    });
    onSearchChange && onSearchChange(value);
    // check minimum requirements for value
    const parsedValue = value.trim();
    if (parsedValue.length >= minChars) {
      if (this.lastestTimerId) {
        clearTimeout(this.lastestTimerId);
      }
      this.lastestTimerId = setTimeout(this.triggerSearch, delayTriggerSearch);
    }
  };

  renderSearchBox = () => {
    const { placeholder, rectangular, inputClassName, icon } = this.props;
    const { isLoading, inputValue } = this.state;

    return (
      <div onFocus={this.handleFocus} onBlur={this.handleBlur}>
        <Input
          fluid
          className={cx(
            cs.searchInput,
            rectangular && cs.rectangular,
            inputClassName
          )}
          icon={icon}
          loading={isLoading}
          placeholder={placeholder}
          onChange={this.handleSearchChange}
          onKeyPress={this.handleKeyDown}
          value={inputValue}
          disableAutocomplete={true}
        />
      </div>
    );
  };

  handleFocus = _ => {
    if (this.hasEnoughChars() && this.props.shouldSearchOnFocus) {
      this.handleSearchChange(this.state.inputValue);
    }

    this.setState({ focus: true }); // open the dropdown
  };

  // If a user selects an option, handleResultSelect will run and update this.props.value before this function runs.
  // So inputValue will equal this.props.value when this function runs and onResultSelect will not be called, which is correct.
  handleBlur = () => {
    const { onResultSelect, value } = this.props;
    const { inputValue } = this.state;

    // If the user has changed the input without selecting an option, select what they currently typed as plain-text.
    if (onResultSelect && inputValue !== value) {
      onResultSelect({ result: inputValue });
    }

    this.closeDropdown();
  };

  buildItem = (categoryKey, result, index) => (
    <BareDropdown.Item
      key={`${categoryKey}-${result.name}`}
      text={
        <div className={cs.entry}>
          <div className={cs.title}>{result.title}</div>
          {result.description && (
            <div className={cs.description}>{result.description}</div>
          )}
        </div>
      }
      onMouseDown={currentEvent => {
        // use onMouseDown instead of onClick to work with handleBlur
        this.handleResultSelect({ currentEvent, result });
      }}
      value={`${categoryKey}-${index}`}
    />
  );

  buildSectionHeader = name => (
    <div key={name} className={cs.category}>
      {name}
    </div>
  );

  renderDropdownItems = () => {
    const { results } = this.state;

    const uncappedForEach = forEach.convert({ cap: false });
    let items = [];
    uncappedForEach((category, key) => {
      items.push(this.buildSectionHeader(category.name));
      uncappedForEach((result, index) => {
        items.push(this.buildItem(key, result, index));
      }, category.results);
    }, results);

    return items;
  };

  getResultsLength = () => {
    const { results } = this.state;
    return sumBy(cat => ((cat || {}).results || []).length, values(results));
  };

  hasEnoughChars = () =>
    this.state.inputValue.trim().length >= this.props.minChars;

  render() {
    const { className, rectangular } = this.props;

    const shouldOpen =
      this.getResultsLength() && this.state.focus && this.hasEnoughChars();

    return (
      <BareDropdown
        className={cx(
          cs.liveSearchPopBox,
          rectangular && cs.rectangular,
          className
        )}
        fluid
        hideArrow
        items={this.renderDropdownItems()}
        onChange={this.handleResultSelect}
        open={shouldOpen ? true : false}
        trigger={this.renderSearchBox()}
        usePortal
        withinModal
        disableAutocomplete={true}
      />
    );
  }
}

LiveSearchPopBox.defaultProps = {
  delayTriggerSearch: 200,
  initialValue: "",
  minChars: 2,
  placeholder: "Search",
  rectangular: false,
  inputMode: false,
  icon: "search",
  shouldSearchOnFocus: false,
};

LiveSearchPopBox.propTypes = {
  className: PropTypes.string,
  delayTriggerSearch: PropTypes.number,
  initialValue: PropTypes.string,
  inputClassName: PropTypes.string,
  inputMode: PropTypes.bool,
  minChars: PropTypes.number,
  onEnter: PropTypes.func,
  onResultSelect: PropTypes.func,
  onSearchChange: PropTypes.func,
  onSearchTriggered: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rectangular: PropTypes.bool,
  value: PropTypes.string,
  icon: PropTypes.string,
  shouldSearchOnFocus: PropTypes.bool,
};

export default LiveSearchPopBox;
