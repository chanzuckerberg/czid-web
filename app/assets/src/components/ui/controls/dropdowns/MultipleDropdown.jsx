import cx from "classnames";
import { find, without, includes } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import BareDropdown from "./BareDropdown";
import CheckboxItem from "./common/CheckboxItem";
import DropdownLabel from "./common/DropdownLabel";
import DropdownTrigger from "./common/DropdownTrigger";
import cs from "./multiple_dropdown.scss";

class MultipleDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value || [],
      valueOnOpen: this.props.value || [],
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

  static getDerivedStateFromProps(props, state) {
    if (props.value !== state.prevPropsValue) {
      return {
        value: props.value,
        prevPropsValue: props.value,
      };
    }
    return null;
  }

  renderMenuItem(option, checked) {
    const { boxed } = this.props;
    return (
      <CheckboxItem
        key={option.value}
        value={option.value}
        label={option.text}
        checked={checked}
        onOptionClick={this.handleOptionClicked}
        boxed={boxed}
      />
    );
  }

  renderMenuItems() {
    const { value: propsValue, options, checkedOnTop } = this.props;
    const { value: stateValue, valueOnOpen } = this.state;
    let checkedOptions = propsValue || stateValue;

    if (checkedOnTop) {
      const checked = valueOnOpen
        .filter(optionValue => find({ value: optionValue }, options))
        .map(optionValue =>
          this.renderMenuItem(
            find({ value: optionValue }, options),
            includes(optionValue, checkedOptions)
          )
        );
      const unchecked = options
        .filter(option => !includes(option.value, valueOnOpen))
        .map(option =>
          this.renderMenuItem(option, includes(option.value, checkedOptions))
        );

      return checked.concat(unchecked);
    } else {
      return options.map(option =>
        this.renderMenuItem(option, includes(option.value, checkedOptions))
      );
    }
  }

  renderText() {
    const { disabled, hideCounter, label, rounded } = this.props;
    const { value } = this.state;

    const labelText =
      !hideCounter && value.length > 0 && label ? label + ":" : label;

    const counterLabel = !hideCounter && value.length > 0 && (
      <DropdownLabel
        className={cs.dropdownLabel}
        disabled={disabled}
        text={String(value.length)}
      />
    );
    return (
      <DropdownTrigger
        className={cs.dropdownTrigger}
        label={labelText}
        value={counterLabel}
        rounded={rounded}
      />
    );
  }

  handleOpen = () => {
    const { checkedOnTop } = this.props;
    if (checkedOnTop) {
      this.setState({
        valueOnOpen: this.state.value.slice(),
      });
    }
  };

  render() {
    const {
      arrowInsideTrigger,
      boxed,
      checkedOnTop,
      hideCounter,
      label,
      onChange,
      options,
      rounded,
      trigger,
      value,
      className,
      ...otherProps
    } = this.props;

    const renderedMenuItems = this.renderMenuItems();
    const searchStrings = renderedMenuItems.map(item => item.props.label);

    return (
      <BareDropdown
        {...otherProps}
        floating
        className={cx(cs.multipleDropdown, className)}
        arrowInsideTrigger={arrowInsideTrigger}
        trigger={trigger || this.renderText()}
        items={renderedMenuItems}
        itemSearchStrings={searchStrings}
        onOpen={this.handleOpen}
        closeOnClick={false}
      />
    );
  }
}

MultipleDropdown.defaultProps = {
  arrowInsideTrigger: true,
  value: [],
};

MultipleDropdown.propTypes = {
  arrowInsideTrigger: PropTypes.bool,
  boxed: PropTypes.bool,
  checkedOnTop: PropTypes.bool,
  disabled: PropTypes.bool,
  hideCounter: PropTypes.bool,
  label: PropTypes.string,
  rounded: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object),
  trigger: PropTypes.node,
  value: PropTypes.array,
  className: PropTypes.string,
  search: PropTypes.bool,
};

export default MultipleDropdown;
