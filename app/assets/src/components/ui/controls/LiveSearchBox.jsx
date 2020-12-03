import React from "react";
import PropTypes from "prop-types";
import { Search } from "semantic-ui-react";
import cx from "classnames";
import cs from "./live_search_box.scss";
import { IconSearch } from "~ui/icons";

class LiveSearchBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      results: [],
      value: this.props.initialValue,
      selectedResult: null,
      lastSearchedTerm: null,
    };

    this.lastestTimerId = null;
  }

  static getDerivedStateFromProps(props, state) {
    if (props.value !== state.prevValue) {
      return {
        prevValue: props.value,
        value: props.value,
      };
    }
    return null;
  }

  handleOnBlur = () => {
    const { lastSearchedTerm } = this.state;
    this.setState({ value: lastSearchedTerm });
  };

  handleKeyDown = keyEvent => {
    const { onEnter, inputMode } = this.props;
    const { value, selectedResult, lastSearchedTerm } = this.state;

    if (keyEvent.key === "Enter") {
      if (lastSearchedTerm !== value) {
        this.setState({ lastSearchedTerm: value });
      }

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
      value: "",
    });
  };

  handleResultSelect = (currentEvent, { result }) => {
    const { onResultSelect } = this.props;
    this.resetComponent();
    onResultSelect && onResultSelect({ currentEvent, result });
  };

  triggerSearch = async () => {
    const { onSearchTriggered } = this.props;
    const { value } = this.state;

    if (!value) return;

    this.setState({ isLoading: true, selectedResult: null });

    const timerId = this.lastestTimerId;
    const results = await onSearchTriggered(value);

    if (timerId === this.lastestTimerId) {
      this.setState({
        isLoading: false,
        results: results,
      });
    }
  };

  handleSearchChange = (_, { value }) => {
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

  render() {
    const { className, placeholder, rectangular } = this.props;
    const { isLoading, results, value } = this.state;

    return (
      <Search
        category
        className={cx(
          cs.liveSearchBox,
          rectangular && cs.rectangular,
          className
        )}
        icon={<IconSearch className={cs.searchIcon} />}
        loading={isLoading}
        onBlur={this.handleOnBlur}
        onKeyDown={this.handleKeyDown}
        onResultSelect={this.handleResultSelect}
        onSearchChange={this.handleSearchChange}
        onSelectionChange={this.handleSelectionChange}
        placeholder={placeholder}
        results={results}
        showNoResults={false}
        value={value || ""}
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
  inputMode: false,
};

LiveSearchBox.propTypes = {
  className: PropTypes.string,
  initialValue: PropTypes.string,
  delayTriggerSearch: PropTypes.number,
  minChars: PropTypes.number,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onEnter: PropTypes.func,
  onSearchTriggered: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func,
  onResultSelect: PropTypes.func,
  rectangular: PropTypes.bool,
  inputMode: PropTypes.bool,
};

export default LiveSearchBox;
