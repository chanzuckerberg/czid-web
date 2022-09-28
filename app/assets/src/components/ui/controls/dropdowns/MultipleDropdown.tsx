import cx from "classnames";
import { find, without, includes } from "lodash/fp";
import React from "react";
import BareDropdown from "./BareDropdown";
import CheckboxItem from "./common/CheckboxItem";
import DropdownLabel from "./common/DropdownLabel";
import DropdownTrigger from "./common/DropdownTrigger";
import cs from "./multiple_dropdown.scss";

interface MultipleDropdownProps {
  arrowInsideTrigger?: boolean;
  boxed?: boolean;
  checkedOnTop?: boolean;
  disabled?: boolean;
  hideCounter?: boolean;
  label?: string;
  rounded?: boolean;
  onChange: $TSFixMeFunction;
  options?: object[];
  trigger?: React.ReactNode;
  value?: unknown[];
  className?: string;
  search?: boolean;
}

class MultipleDropdown extends React.Component<MultipleDropdownProps> {
  constructor(props: $TSFixMe) {
    super(props);

    this.state = {
      value: this.props.value || [],
      valueOnOpen: this.props.value || [],
    };
  }

  handleOptionClicked = (value: $TSFixMe, isChecked: $TSFixMe) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
    let selectedValues = this.state.value.slice();
    if (!isChecked) {
      selectedValues = without([value], selectedValues);
    } else {
      selectedValues.push(value);
    }
    this.setState({ value: selectedValues });
    this.props.onChange && this.props.onChange(selectedValues);
  };

  handleItemClicked = (event: $TSFixMe) => event.stopPropagation();

  static getDerivedStateFromProps(props: $TSFixMe, state: $TSFixMe) {
    if (props.value !== state.prevPropsValue) {
      return {
        value: props.value,
        prevPropsValue: props.value,
      };
    }
    return null;
  }

  renderMenuItem(option: $TSFixMe, checked: $TSFixMe) {
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const { value: stateValue, valueOnOpen } = this.state;
    const checkedOptions = propsValue || stateValue;

    if (checkedOnTop) {
      const checked = valueOnOpen
        .filter((optionValue: $TSFixMe) =>
          find({ value: optionValue }, options),
        )
        .map((optionValue: $TSFixMe) =>
          this.renderMenuItem(
            find({ value: optionValue }, options),
            includes(optionValue, checkedOptions),
          ),
        );
      const unchecked = options
        .filter((option: $TSFixMe) => !includes(option.value, valueOnOpen))
        .map((option: $TSFixMe) =>
          this.renderMenuItem(option, includes(option.value, checkedOptions)),
        );

      return checked.concat(unchecked);
    } else {
      return options.map((option: $TSFixMe) =>
        this.renderMenuItem(option, includes(option.value, checkedOptions)),
      );
    }
  }

  renderText() {
    const { disabled, hideCounter, label, rounded } = this.props;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
        valueOnOpen: this.state.value.slice(),
      });
    }
  };

  render() {
    const {
      arrowInsideTrigger,
      trigger,
      className,
      ...otherProps
    } = this.props;

    const renderedMenuItems = this.renderMenuItems();
    const searchStrings = renderedMenuItems.map(
      (item: $TSFixMe) => item.props.label,
    );

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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
MultipleDropdown.defaultProps = {
  arrowInsideTrigger: true,
  value: [],
};

export default MultipleDropdown;
