import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { Search } from "semantic-ui-react";
import { escapeRegExp, debounce } from "lodash";

import { get } from "~/api/core";
import { getURLParamString } from "~/helpers/url";
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

    if (keyEvent.key == "Enter") {
      onEnter(keyEvent);
    }
  };

  resetComponent = () => {
    this.setState({
      isLoading: false,
      results: [],
      value: null
    });
  };

  handleResultSelect(_, { result }) {
    const { onResultSelect } = this.props;

    this.resetComponent();
    onResultSelect && onResultSelect({ result });
  }

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
    const { isLoading, value, results } = this.state;
    const { onResultSelect, placeholder } = this.props;
    return (
      <Search
        category
        className={cs.liveSearchBox}
        loading={isLoading}
        onKeyDown={this.onKeyDown}
        onResultSelect={onResultSelect}
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
  minChars: 2
};
LiveSearchBox.propTypes = {
  initialValue: PropTypes.string,
  delayTriggerSearch: PropTypes.number,
  minChars: PropTypes.number,
  onSearchTriggered: PropTypes.func.isRequired,
  onResultSelected: PropTypes.func
};

export default LiveSearchBox;
