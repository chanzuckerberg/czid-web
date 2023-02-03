import cx from "classnames";
import { escapeRegExp, debounce } from "lodash";
import React from "react";
import { Search } from "semantic-ui-react";

import { get } from "~/api/core";
import { getURLParamString } from "~/helpers/url";
import { IconSearch } from "~ui/icons";
import cs from "./search_box.scss";

interface SearchBoxProps {
  // Provide either clientSearchSource or serverSearchAction.
  // If clientSearchSource is provided, query matching will happen on the client side (use for small data).
  // If serverSearchAction is provided, query matching will happen on the server side (use for large data).
  clientSearchSource?: $TSFixMe;
  serverSearchAction?: string;
  serverSearchActionArgs?: object;
  rounded?: boolean;
  category?: boolean;
  levelLabel?: boolean;
  initialValue?: string;
  onResultSelect?: $TSFixMeFunction;
  placeholder?: string;
  // indicates if field is cleared when user selects a result
  clearOnSelect?: boolean;
  onEnter?: $TSFixMeFunction;
}

interface SearchBoxState {
  isLoading: boolean;
  results: $TSFixMe;
  value: $TSFixMe;
  selectedResult: boolean;
}

class SearchBox extends React.Component<SearchBoxProps, SearchBoxState> {
  waitHandleSearchChange: number;
  minChars: number;
  placeholder: string;
  handleEnter: $TSFixMeFunction;
  blankState: {
    isLoading: boolean;
    results: $TSFixMe[];
    value: string;
    selectedResult: any;
  };
  handleServerSearchActionDebounced: any;
  static defaultProps: SearchBoxProps;
  constructor(props: SearchBoxProps) {
    super(props);

    // 200 ms matches tuning done for AUTOCOMPLETE_DEBOUNCE_DELAY
    this.waitHandleSearchChange = 200;
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
    // We care about debouncing handleServerSearchAction and not
    // handleSearchChange because we want the input box to update immediately,
    // but the API calls should be moderated in the background. Frontend search
    // (clientSearchSource) also does not need debouncing:
    this.handleServerSearchActionDebounced = debounce(
      this.handleServerSearchAction,
      this.waitHandleSearchChange,
    );

    this.state = {
      isLoading: false,
      results: [],
      value: this.props.initialValue,
      selectedResult: null,
    };
  }

  onKeyDown = (e: { key: unknown }) => {
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

  handleResultSelect(e: unknown, { result }: { result: { title: unknown } }) {
    const { clearOnSelect } = this.props;
    this.setState({ value: clearOnSelect ? "" : result.title });
    this.props.onResultSelect(e, { result });
  }

  handleServerSearchAction = async () => {
    const {
      levelLabel,
      serverSearchAction,
      serverSearchActionArgs,
    } = this.props;
    const { value } = this.state;

    let url = `/${serverSearchAction}?query=${value}`;
    if (serverSearchActionArgs) {
      url += `&${getURLParamString(serverSearchActionArgs)}`;
    }
    const searchResults = await get(url);
    if (levelLabel) {
      for (let i = 0; i < searchResults.length; i++) {
        searchResults[i].title += " (" + searchResults[i].level + ")";
      }
    }

    this.setState({
      isLoading: false,
      results: searchResults,
    });
  };

  handleSearchChange = (_: unknown, { value }: { value: string }) => {
    const { serverSearchAction, clientSearchSource } = this.props;

    this.setState({ isLoading: true, selectedResult: null, value });

    if (value.length === 0) {
      this.setState(this.blankState);
      return;
    }
    if (value.length < this.minChars) return;

    if (clientSearchSource) {
      const re = new RegExp(escapeRegExp(value), "i");
      const isMatch = (result: { title: string }) => re.test(result.title);
      const searchResults = clientSearchSource.filter(isMatch);

      this.setState({
        isLoading: false,
        results: searchResults,
      });
    } else if (serverSearchAction) {
      this.handleServerSearchActionDebounced();
    }
  };

  render() {
    const { isLoading, value, results } = this.state;
    return (
      <Search
        className={cx(
          "idseq-ui input search",
          cs.searchBox,
          this.props.rounded && cs.rounded,
        )}
        icon={<IconSearch className={cs.searchIcon} />}
        loading={isLoading}
        category={this.props.category}
        onSearchChange={this.handleSearchChange}
        results={results}
        // This fixes '`value` prop on `input` should not be null. Consider
        // using an empty string to clear the component or `undefined` for
        // uncontrolled components.' We pick empty string because we're using
        // Search as a controlled component:
        value={value || ""}
        placeholder={this.placeholder}
        onResultSelect={this.handleResultSelect}
        onSelectionChange={(_, { result }) => {
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

export default SearchBox;
