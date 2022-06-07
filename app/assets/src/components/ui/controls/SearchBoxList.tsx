import cx from "classnames";
import React from "react";

import Input from "~ui/controls/Input";
import { IconCheckSmall, IconSearch } from "~ui/icons";

import cs from "./search_box_list.scss";

interface SearchBoxListProps {
  options?: $TSFixMe;
  selected?: $TSFixMe;
  onChange?: $TSFixMeFunction;
  onFilterChange?: $TSFixMeFunction;
  title?: string;
  labelTitle?: string;
  countTitle?: string;
}

interface searchBoxListState {
  selected: $TSFixMe;
  filteredOptions: $TSFixMe;
}

class SearchBoxList extends React.Component<
  SearchBoxListProps,
  searchBoxListState
> {
  static defaultProps: SearchBoxListProps;
  sortedOptions: $TSFixMe[];
  constructor(props) {
    super(props);

    const selected = new Set(this.props.selected);
    this.sortedOptions = this.sortOptions(this.props.options, selected);
    this.state = {
      // Filtered options can be controlled by the client by setting an onFilterChange
      filteredOptions: this.sortOptions(this.props.options, selected),
      // Selected is controlled internally
      selected,
    };
  }

  componentDidUpdate = (prevProps, prevState) => {
    // object comparison only
    if (prevProps.options !== this.props.options) {
      this.setState({
        filteredOptions: this.sortOptions(
          this.props.options,
          prevState.selected,
        ),
      });
    }
  };

  handleOptionClick = optionValue => {
    const selected = new Set(this.state.selected);
    if (selected.has(optionValue)) {
      selected.delete(optionValue);
    } else {
      selected.add(optionValue);
    }
    this.setState({ selected }, () => {
      return this.props.onChange && this.props.onChange(this.state.selected);
    });
  };

  handleFilterChange = filter => {
    this.setState({
      filteredOptions: this.sortedOptions.filter(option =>
        option.label.toLowerCase().includes(filter),
      ),
    });
  };

  sortOptions(options, selected) {
    const sortByLabel = (a, b) => (a.label > b.label ? 1 : -1);

    // TODO(tcarvalho): review data structures to simplify this function
    const selectedOptions = {};
    const unselectedOptions = [];
    options.forEach(option => {
      if (selected.has(option.value)) {
        selectedOptions[option.value] = option;
      } else {
        unselectedOptions.push(option);
      }
    });
    unselectedOptions.sort(sortByLabel);

    return (
      Array.from(selected)
        .map(optionValue => selectedOptions[optionValue])
        // Filter out any selected fields that aren't present. Otherwise, this will cause an error.
        .filter(option => option !== undefined)
        .sort(sortByLabel)
        .concat(unselectedOptions)
    );
  }

  render() {
    const { onFilterChange } = this.props;
    const { filteredOptions } = this.state;

    return (
      <div className={cs.searchBoxList}>
        {this.props.title && <div className={cs.title}>{this.props.title}</div>}
        <div>
          <Input
            fluid
            className={cs.searchBox}
            icon={<IconSearch className={cs.searchBoxIcon} />}
            placeholder="Search"
            onChange={onFilterChange || this.handleFilterChange}
          />
        </div>
        <div className={cs.listBox}>
          {(this.props.labelTitle || this.props.countTitle) && (
            <div className={cs.listColumnTitles}>
              {this.props.labelTitle && (
                <div className={cs.listColumnTitle}>
                  {this.props.labelTitle}
                </div>
              )}
              {this.props.countTitle && (
                <div className={cs.listColumnTitle}>
                  {this.props.countTitle}
                </div>
              )}
            </div>
          )}
          {filteredOptions.map(option => (
            <div
              className={cx(cs.listElement, {
                active: this.state.selected.has(option.value),
              })}
              key={`option-${option.value}`}
              onClick={() => this.handleOptionClick(option.value)}
            >
              <div className={cs.listCheckmark}>
                {this.state.selected.has(option.value) && <IconCheckSmall />}
              </div>
              <div className={cs.listLabel}>{option.label}</div>
              {option.count && (
                <div className={cs.listElementCount}>{option.count}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

SearchBoxList.defaultProps = {
  selected: [],
  labelTitle: null,
  countTitle: null,
};

export default SearchBoxList;
