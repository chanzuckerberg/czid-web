import React from "react";
import PropTypes from "prop-types";
import CheckmarkIcon from "ui/icons/CheckmarkIcon";
import Input from "ui/controls/Input";
import cs from "./search_box_list.scss";
import cx from "classnames";
import { partition } from "lodash/fp";

class SearchBoxList extends React.Component {
  constructor(props) {
    super(props);

    this.sortedOptions = this.sortOptions();

    this.state = {
      filteredOptions: this.sortedOptions,
      selected: new Set(this.props.selected)
    };
  }

  handleOptionClick = optionValue => {
    let selected = new Set(this.state.selected);
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
        option.label.toLowerCase().includes(this.state.filter)
      )
    });
  };

  sortOptions() {
    // TODO(tcarvalho): consider reviewing data structures to simplify this function
    let [selectedOptions, unselectedOptions] = partition(
      option => this.state.selected.has(option.value),
      this.props.options
    );
    return Array.from(this.state.selected)
      .map(optionValue => selectedOptions[optionValue])
      .concat(unselectedOptions);
  }

  render() {
    return (
      <div className={cs.searchBoxList}>
        {this.props.title && <div className={cs.title}>{this.props.title}</div>}
        <div>
          <Input
            fluid
            className={cs.searchBox}
            icon="search"
            placeholder="Search"
            onChange={this.handleFilterChange}
          />
        </div>
        <div className={cs.listBox}>
          {this.state.filteredOptions.map(option => (
            <div
              className={cx(cs.listElement, {
                active: this.state.selected.has(option.value)
              })}
              key={`option-${option.value}`}
              onClick={() => this.handleOptionClick(option.value)}
            >
              <div className={cs.listCheckmark}>
                {this.state.selected.has(option.value) && (
                  <CheckmarkIcon size="small" />
                )}
              </div>
              <div className={cs.listLabel}>{option.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

SearchBoxList.defaultProps = {
  selected: []
};

SearchBoxList.propTypes = {
  options: PropTypes.array,
  selected: PropTypes.oneOfType([
    PropTypes.instanceOf(Set), // for sets
    PropTypes.array
  ]),
  onChange: PropTypes.func,
  title: PropTypes.string
};

export default SearchBoxList;
