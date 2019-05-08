import React from "react";
import PropTypes from "prop-types";
import { Search } from "semantic-ui-react";
import cs from "./live_search_box.scss";

class LiveSearchBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      results: [],
      value: this.props.initialValue
    };

    this.lastestTimerId = null;
  }

  handleKeyDown = keyEvent => {
    const { onEnter } = this.props;
    const { value } = this.state;

    if (keyEvent.key == "Enter") {
      onEnter({ current: keyEvent, value });
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
    const { onResultSelect } = this.props;

    this.resetComponent();
    onResultSelect && onResultSelect({ currentEvent, result });
  };

  triggerSearch = async () => {
    const { onSearchTriggered } = this.props;
    const { value } = this.state;

    this.setState({ isLoading: true });

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

  render() {
    const { hasCategories } = this.props;
    const { isLoading, value, results } = this.state;

    return (
      <Search
        category={hasCategories}
        className={cs.liveSearchBox}
        loading={isLoading}
        onKeyDown={this.handleKeyDown}
        onResultSelect={this.handleResultSelect}
        onSearchChange={this.handleSearchChange}
        placeholder="Search"
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
  hasCategories: true
};

LiveSearchBox.propTypes = {
  initialValue: PropTypes.string,
  delayTriggerSearch: PropTypes.number,
  minChars: PropTypes.number,
  onEnter: PropTypes.func,
  onSearchTriggered: PropTypes.func.isRequired,
  onResultSelect: PropTypes.func,
  hasCategories: PropTypes.bool
};

export default LiveSearchBox;
