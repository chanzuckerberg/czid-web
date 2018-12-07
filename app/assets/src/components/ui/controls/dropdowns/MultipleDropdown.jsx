import PropTypes from "prop-types";
import { without, omit, includes } from "lodash/fp";
import React from "react";
import BareDropdown from "./BareDropdown";
import DropdownTrigger from "./common/DropdownTrigger";
import DropdownLabel from "./common/DropdownLabel";
import CheckboxItem from "./common/CheckboxItem";
import cs from "./multiple_dropdown.scss";

class MultipleDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value || []
    };
  }

  handleOptionClicked = (value, isChecked) => {
    let selectedValues = this.state.value.slice();
    if (!isChecked) {
      selectedValues = without([value], selectedValues);
    } else {
      selectedValues.push(value);
    }
    this.setState({ value: selectedValues });
    this.props.onChange && this.props.onChange(selectedValues);
  };

  handleItemClicked = event => event.stopPropagation();

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value) {
      this.setState({ value: nextProps.value });
    }
  }

  renderMenuItems() {
    let ret = [];
    let checkedOptions = this.props.value || this.state.value;
    for (let option of this.props.options) {
      ret.push(
        <CheckboxItem
          key={option.value}
          value={option.value}
          label={option.text}
          checked={includes(option.value, checkedOptions)}
          onOptionClick={this.handleOptionClicked}
        />
      );
    }
    return ret;
  }

  renderText() {
    const label = this.state.value.length > 0 && (
      <DropdownLabel
        className={cs.dropdownLabel}
        disabled={this.props.disabled}
        text={String(this.state.value.length)}
      />
    );
    return (
      <DropdownTrigger
        className={cs.dropdownTrigger}
        label={this.props.label}
        value={label}
        rounded={this.props.rounded}
      />
    );
  }

  render() {
    const otherProps = omit(
      ["label", "options", "value", "rounded", "onChange"],
      this.props
    );

    return (
      <BareDropdown
        floating
        className={cs.multipleDropdown}
        {...otherProps}
        arrowInsideTrigger
        trigger={this.renderText()}
      >
        <BareDropdown.Menu>{this.renderMenuItems()}</BareDropdown.Menu>
      </BareDropdown>
    );
  }
}

MultipleDropdown.defaultProps = {
  value: []
};

MultipleDropdown.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object),
  value: PropTypes.array,
  rounded: PropTypes.bool,
  disabled: PropTypes.bool
};

export default MultipleDropdown;
