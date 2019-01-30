import React from "react";
import PropTypes from "prop-types";
import CheckmarkIcon from "~ui/icons/CheckmarkIcon";
import Input from "~ui/controls/Input";
import cs from "./search_box_list.scss";
import cx from "classnames";

class SearchBoxList extends React.Component {
  constructor(props) {
    super(props);

    let selected = new Set(this.props.selected);
    this.sortedOptions = this.sortOptions(this.props.options, selected);

    this.state = {
      filteredOptions: this.sortedOptions,
      selected
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
        option.label.toLowerCase().includes(filter)
      )
    });
  };

  sortOptions(options, selected) {
    const sortByLabel = (a, b) => (a.label > b.label ? 1 : -1);

    // TODO(tcarvalho): review data structures to simplify this function
    let selectedOptions = {};
    let unselectedOptions = [];
    options.forEach(option => {
      if (selected.has(option.value)) {
        selectedOptions[option.value] = option;
      } else {
        unselectedOptions.push(option);
      }
    });
    unselectedOptions.sort(sortByLabel);

    return Array.from(selected)
      .map(optionValue => selectedOptions[optionValue])
      .sort(sortByLabel)
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
