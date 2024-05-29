import cx from "classnames";
import React from "react";
import { Search } from "semantic-ui-react";
import { IconSearch } from "~ui/icons";
import cs from "./live_search_box.scss";

interface LiveSearchBoxProps {
  className?: string;
  initialValue?: string;
  delayTriggerSearch?: number;
  minChars?: number;
  placeholder?: string;
  value?: string;
  projectId?: string;
  onEnter?: $TSFixMeFunction;
  onSearchTriggered?: (query: string, projectId: string) => Promise<$TSFixMe>;
  onSearchChange?: $TSFixMeFunction;
  onResultSelect?: (params: {
    currentEvent:
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | React.KeyboardEvent;
    result: unknown;
  }) => void;
  rectangular?: boolean;
  inputMode?: boolean;
}

interface LiveSearchBoxState {
  isLoading: boolean;
  results: $TSFixMe;
  value: string;
  selectedResult: boolean;
  lastSearchedTerm: string;
  projectId: string | null;
}

class LiveSearchBox extends React.Component<
  LiveSearchBoxProps,
  LiveSearchBoxState
> {
  lastestTimerId: any;
  static defaultProps: LiveSearchBoxProps;
  constructor(props: LiveSearchBoxProps) {
    super(props);

    this.state = {
      isLoading: false,
      results: [],
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      value: this.props.initialValue,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      selectedResult: null,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      lastSearchedTerm: null,
      projectId: null,
    };

    this.lastestTimerId = null;
  }

  static getDerivedStateFromProps(
    props: LiveSearchBoxProps,
    state: {
      prevValue: string;
      value: string;
    },
  ) {
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

  handleKeyDown = (keyEvent: React.KeyboardEvent) => {
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

  handleResultSelect = (
    currentEvent:
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | React.KeyboardEvent,
    { result },
  ) => {
    const { onResultSelect } = this.props;
    this.resetComponent();
    onResultSelect && onResultSelect({ currentEvent, result });
  };

  triggerSearch = async () => {
    const { onSearchTriggered, projectId } = this.props;
    const { value } = this.state;

    if (!value) return;

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.setState({ isLoading: true, selectedResult: null });

    const timerId = this.lastestTimerId;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    const results = await onSearchTriggered(value, projectId);
    if (timerId === this.lastestTimerId) {
      this.setState({
        isLoading: false,
        results: results,
      });
    }
  };

  handleSearchChange = (_: unknown, { value }) => {
    const { delayTriggerSearch, minChars, onSearchChange } = this.props;

    this.setState({ value });
    onSearchChange && onSearchChange(value);
    // check minimum requirements for value
    const parsedValue = value.trim();
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (parsedValue.length >= minChars) {
      if (this.lastestTimerId) {
        clearTimeout(this.lastestTimerId);
      }
      this.lastestTimerId = setTimeout(
        this.triggerSearch,
        delayTriggerSearch,
        value,
      );
    }
  };

  handleSelectionChange = (_e: unknown, { result }) => {
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
          className,
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

export default LiveSearchBox;
