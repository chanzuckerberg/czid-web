import React from "react";
import PropTypes from "prop-types";
import { Search } from "semantic-ui-react";
import cx from "classnames";
import cs from "./live_search_box.scss";

class LiveSearchBox extends React.Component {
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

  handleKeyDown = keyEvent => {
    const { onEnter, inputMode } = this.props;
    const { value, selectedResult } = this.state;

    if (keyEvent.key === "Enter") {
      if (inputMode && !selectedResult) {
        // In input mode, if they didn't select anything, count it as submitting what they entered.
        this.handleResultSelect(keyEvent, { result: value });
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

  handleResultSelect = (currentEvent, { result }) => {
    const { onResultSelect, inputMode } = this.props;

    if (!inputMode) {
      this.resetComponent();
    } else {
      // In input mode, keep 'value' in the box.
      this.setState({
        isLoading: false,
        results: []
      });
    }
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

  handleSearchChange = (_, { value }) => {
    const { delayTriggerSearch, minChars } = this.props;

    this.setState({ value });
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

  render() {
    const { placeholder, rectangular } = this.props;
    const { isLoading, value, results } = this.state;

    return (
      <Search
        category
        className={cx(cs.liveSearchBox, rectangular && cs.rectangular)}
        loading={isLoading}
        onKeyDown={this.handleKeyDown}
        onResultSelect={this.handleResultSelect}
        onSearchChange={this.handleSearchChange}
        onSelectionChange={this.handleSelectionChange}
        placeholder={placeholder}
        results={results}
        showNoResults={false}
        value={value}
      />
    );
  }
}

LiveSearchBox.defaultProps = {
  delayTriggerSearch: 1000,
  initialValue: "",
  minChars: 2,
  placeholder: "Search",
  rectangular: false,
  inputMode: false
};

LiveSearchBox.propTypes = {
  initialValue: PropTypes.string,
  delayTriggerSearch: PropTypes.number,
  minChars: PropTypes.number,
  placeholder: PropTypes.string,
  onEnter: PropTypes.func,
  onSearchTriggered: PropTypes.func.isRequired,
  onResultSelect: PropTypes.func,
  rectangular: PropTypes.bool,
  inputMode: PropTypes.bool
};

export default LiveSearchBox;
