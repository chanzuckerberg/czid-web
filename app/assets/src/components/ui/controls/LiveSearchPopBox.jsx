import React from "react";
import PropTypes from "prop-types";
import Input from "~ui/controls/Input";
import { BareDropdown } from "~ui/controls/dropdowns";
import { Search } from "semantic-ui-react";
import { concat, forEach, map, sumBy, values } from "lodash/fp";
import cx from "classnames";
import cs from "./live_search_pop_box.scss";

class LiveSearchPopBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      results: [],
      value: this.props.initialValue,
      selectedResult: null
    };

    this.lastestTimerId = null;
  }

  static getDerivedStateFromProps(props, state) {
    if (props.value !== state.prevPropsValue) {
      return {
        value: props.value,
        prevPropsValue: props.value
      };
    }
    return null;
  }

  handleKeyDown = keyEvent => {
    const { onEnter, inputMode } = this.props;
    const { value, selectedResult } = this.state;

    if (keyEvent.key === "Enter") {
      if (inputMode && !selectedResult) {
        // In input mode, if they didn't select anything, count it as submitting what they entered.
        this.handleResultSelect({ currentEvent: keyEvent, result: value });
      }
      onEnter && onEnter({ current: keyEvent, value });
    }
  };

  resetComponent = () => {
    this.setState({
      isLoading: false,
      results: [],
      value: ""
    });
  };

  handleResultSelect = ({ currentEvent, result }) => {
    const { onResultSelect } = this.props;
    this.resetComponent();
    onResultSelect && onResultSelect({ currentEvent, result });
  };

  triggerSearch = async () => {
    const { onSearchTriggered } = this.props;
    const { value } = this.state;

    this.setState({ isLoading: true, selectedResult: null });

    const timerId = this.lastestTimerId;
    const results = await onSearchTriggered(value);

    if (timerId === this.lastestTimerId) {
      this.setState({
        isLoading: false,
        results: results
      });
    }
  };

  handleSearchChange = value => {
    const { delayTriggerSearch, minChars, onSearchChange } = this.props;

    this.setState({ value });
    onSearchChange && onSearchChange(value);
    // check minimum requirements for value
    const parsedValue = value.trim();
    if (parsedValue.length >= minChars) {
      if (this.lastestTimerId) {
        clearTimeout(this.lastestTimerId);
      }
      this.lastestTimerId = setTimeout(
        this.triggerSearch,
        delayTriggerSearch,
        value
      );
    }
  };

  handleSelectionChange = (e, { result }) => {
    this.setState({ selectedResult: result });
  };

  renderSearchBox = () => {
    const { placeholder, rectangular } = this.props;
    const { isLoading, value } = this.state;
    return (
      <Input
        fluid
        className={cx(cs.searchInput, rectangular && cs.rectangular)}
        icon="search"
        loading={isLoading}
        placeholder={placeholder}
        onChange={this.handleSearchChange}
        onKeyPress={this.handleKeyDown}
        value={value}
      />
    );
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
      onClick={currentEvent =>
        this.handleResultSelect({ currentEvent, result })
      }
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

  render() {
    const { className, rectangular } = this.props;

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
        open={this.getResultsLength() ? null : false}
        trigger={this.renderSearchBox()}
        usePortal
        withinModal
      />
    );
  }
}

LiveSearchPopBox.defaultProps = {
  delayTriggerSearch: 1000,
  initialValue: "",
  minChars: 2,
  placeholder: "Search",
  rectangular: false,
  inputMode: false
};

LiveSearchPopBox.propTypes = {
  className: PropTypes.string,
  initialValue: PropTypes.string,
  inputMode: PropTypes.bool,
  delayTriggerSearch: PropTypes.number,
  minChars: PropTypes.number,
  onEnter: PropTypes.func,
  onSearchTriggered: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func,
  onResultSelect: PropTypes.func,
  placeholder: PropTypes.string,
  rectangular: PropTypes.bool,
  value: PropTypes.string
};

export default LiveSearchPopBox;
