import React from "react";
import PropTypes from "prop-types";
import CheckmarkIcon from "~/components/ui/icons/CheckmarkIcon";
import Input from "~/components/ui/controls/Input";
import cs from "./search_box_list.scss";
import cx from "classnames";

class SearchBoxList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filter: "",
      selected: new Set(this.props.selected)
    };

    this.sortedOptions = this.sortOptions();
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

  handleFilterChange = filter => this.setState({ filter });

  sortOptions() {
    // TODO(tcarvalho): review data structures to simplify this function
    let selectedOptions = {};
    let unselectedOptions = [];
    this.props.options.forEach(option => {
      if (this.state.selected.has(option.value)) {
        selectedOptions[option.value] = option;
      } else {
        unselectedOptions.push(option);
      }
    });
    return Array.from(this.state.selected)
      .map(optionValue => selectedOptions[optionValue])
      .concat(unselectedOptions);
  }

  render() {
    return (
      <div className={cs.searchBoxList}>
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
          {this.sortedOptions.map(
            option =>
              option.label.toLowerCase().includes(this.state.filter) && (
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
              )
          )}
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
  onChange: PropTypes.func
};

export default SearchBoxList;
