import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import { Search } from "semantic-ui-react";
import { escapeRegExp, debounce } from "lodash";

import cs from "./search_box.scss";
import { get } from "~/api/core";
import { getURLParamString } from "~/helpers/url";
import { IconSearch } from "~ui/icons";

class SearchBox extends React.Component {
  constructor(props) {
    super(props);

    this.delayCheckMatch = 1000;
    this.waitHandleSearchChange = 500;
    this.minChars = 2;

    this.placeholder = this.props.placeholder;
    this.handleEnter = this.props.onEnter;
    this.handleResultSelect = this.handleResultSelect.bind(this);
    this.blankState = {
      isLoading: false,
      results: [],
      value: "",
      selectedResult: null,
    };

    this.state = {
      isLoading: false,
      results: [],
      value: this.props.initialValue,
      selectedResult: null,
    };
  }

  onKeyDown = e => {
    // Defines action to be performed when user hits Enter without selecting one of the search results
    if (e.key === "Enter" && !this.state.selectedResult && this.props.onEnter) {
      this.props.onEnter(e);
      this.resetComponent();
    }
  };

  resetComponent = () => {
    this.setState({
      isLoading: false,
      results: [],
      value: this.state.value, // necessary for closing dropdown but keeping text entered in input
      selectedResult: null,
    });
  };

  handleResultSelect(e, { result }) {
    const { clearOnSelect } = this.props;
    this.setState({ value: clearOnSelect ? "" : result.title });
    this.props.onResultSelect(e, { result });
  }

  handleSearchChange = (e, { value }) => {
    this.setState({ isLoading: true, selectedResult: null, value });

    setTimeout(async () => {
      if (this.state.value.length === 0) {
        this.setState(this.blankState);
        return;
      }
      if (this.state.value.length < this.minChars) return;

      let searchResults;
      if (this.props.clientSearchSource) {
        const re = new RegExp(escapeRegExp(this.state.value), "i");
        const isMatch = result => re.test(result.title);
        searchResults = this.props.clientSearchSource.filter(isMatch);
      } else if (this.props.serverSearchAction) {
        let url = `/${this.props.serverSearchAction}?query=${this.state.value}`;
        if (this.props.serverSearchActionArgs) {
          url += `&${getURLParamString(this.props.serverSearchActionArgs)}`;
        }
        searchResults = await get(url);
        if (this.props.levelLabel) {
          for (let i = 0; i < searchResults.length; i++) {
            searchResults[i].title += " (" + searchResults[i].level + ")";
          }
        }
      }

      this.setState({
        isLoading: false,
        results: searchResults,
      });
    }, this.delayCheckMatch);
  };

  render() {
    const { isLoading, value, results } = this.state;
    return (
      <Search
        className={cx(
          "idseq-ui input search",
          cs.searchBox,
          this.props.rounded && cs.rounded
        )}
        icon={<IconSearch className={cs.searchIcon} />}
        loading={isLoading}
        category={this.props.category}
        onSearchChange={debounce(
          this.handleSearchChange,
          this.waitHandleSearchChange,
          {
            leading: true,
          }
        )}
        results={results}
        value={value}
        placeholder={this.placeholder}
        onResultSelect={this.handleResultSelect}
        onSelectionChange={(e, { result }) => {
          this.setState({ selectedResult: result });
        }}
        onKeyDown={this.onKeyDown}
        showNoResults={false}
      />
    );
  }
}

SearchBox.defaultProps = {
  clearOnSelect: false,
};

SearchBox.propTypes = {
  // Provide either clientSearchSource or serverSearchAction.
  // If clientSearchSource is provided, query matching will happen on the client side (use for small data).
  // If serverSearchAction is provided, query matching will happen on the server side (use for large data).
  clientSearchSource: PropTypes.array,
  serverSearchAction: PropTypes.string,
  serverSearchActionArgs: PropTypes.object,
  rounded: PropTypes.bool,
  category: PropTypes.bool,
  levelLabel: PropTypes.bool,
  initialValue: PropTypes.string,
  onResultSelect: PropTypes.func,
  placeholder: PropTypes.string,
  // indicates if field is cleared when user selects a result
  clearOnSelect: PropTypes.bool,
};

export default SearchBox;
