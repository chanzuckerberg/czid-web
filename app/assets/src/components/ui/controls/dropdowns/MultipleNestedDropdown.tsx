import { omit } from "lodash/fp";
import React from "react";
import ArrayUtils from "../../../utils/ArrayUtils";
import BareDropdown from "./BareDropdown";
import CheckboxItem from "./common/CheckboxItem";
import DropdownLabel from "./common/DropdownLabel";
import DropdownTrigger from "./common/DropdownTrigger";
import cs from "./multiple_nested_dropdown.scss";

interface MultipleNestedDropdownProps {
  boxed?: boolean;
  label?: string;
  onChange?: $TSFixMeFunction;
  options?: unknown[];
  selectedOptions?: unknown[];
  selectedSuboptions?: object;
  disabled?: boolean;
  rounded?: boolean;
  disableMarginRight?: boolean;
  placeholder?: string;
  useDropdownLabelCounter?: boolean;
}

class MultipleNestedDropdown extends React.Component<
  MultipleNestedDropdownProps
> {
  suboptionsToOptionMap: $TSFixMe;
  constructor(props: $TSFixMe) {
    super(props);

    this.state = {
      selectedOptions: this.props.selectedOptions || [],
      selectedSuboptions: this.props.selectedSuboptions || {},
      oldSelectedOptions: [],
      oldSelectedSuboptions: {},
    };

    this.suboptionsToOptionMap = {};
    this.props.options.forEach((option: $TSFixMe) => {
      (option.suboptions || []).forEach((suboption: $TSFixMe) => {
        this.suboptionsToOptionMap[suboption.value] = option.value;
      });
    });

    this.handleOptionClicked = this.handleOptionClicked.bind(this);
    this.handleSuboptionClicked = this.handleSuboptionClicked.bind(this);
  }

  static getDerivedStateFromProps(props: $TSFixMe, state: $TSFixMe) {
    let newState = null;
    if (
      props.selectedOptions !== state.oldSelectedOptions ||
      !ArrayUtils.equal(props.selectedOptions, state.oldSelectedOptions)
    ) {
      newState = Object.assign(
        {},
        {
          selectedOptions: props.selectedOptions,
          oldSelectedOptions: props.selectedOptions,
        },
      );
    }

    if (
      props.selectedSuboptions !== state.oldSelectedSuboptions ||
      !MultipleNestedDropdown.areSuboptionsEqual(
        props.selectedSuboptions,
        state.oldSelectedSuboptions,
      )
    ) {
      newState = Object.assign(newState || {}, {
        selectedSuboptions: props.selectedSuboptions,
        oldSelectedSuboptions: props.selectedSuboptions,
      });
    }

    return newState;
  }

  static areSuboptionsEqual(suboptions1: $TSFixMe, suboptions2: $TSFixMe) {
    if (!suboptions1 || !suboptions2) return suboptions1 === suboptions2;
    if (Object.keys(suboptions1) !== Object.keys(suboptions2)) return false;
    for (const key in suboptions1) {
      if (!(key in suboptions2)) return false;
      if (!ArrayUtils.equal(suboptions1[key], suboptions2[key])) return false;
    }
    return true;
  }

  handleOptionClicked(optionValue: $TSFixMe, isChecked: $TSFixMe) {
    if (isChecked) {
      // when option is checked, check all suboptions
      this.setState(
        prevState => {
          const stateUpdate = {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
            selectedOptions: [...prevState.selectedOptions, optionValue],
          };
          const optionClicked = this.props.options.find(
            (option: $TSFixMe) => option.value === optionValue,
          );
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'suboptions' does not exist on type ... Remove this comment to see the full error message
          if (optionClicked.suboptions) {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'suboptions' does not exist on type ... Remove this comment to see the full error message
            const selectedSuboptions = optionClicked.suboptions.map(
              (suboption: $TSFixMe) => suboption.value,
            );
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            prevState.selectedSuboptions[optionValue] = selectedSuboptions;
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            stateUpdate.selectedSuboptions = prevState.selectedSuboptions;
          }
          return stateUpdate;
        },
        () => {
          this.props.onChange(
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
            this.state.selectedOptions,
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            this.state.selectedSuboptions,
          );
        },
      );
    } else {
      this.setState(
        prevState => {
          return {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
            selectedOptions: prevState.selectedOptions.filter(
              (value: $TSFixMe) => value !== optionValue,
            ),
          };
        },
        () =>
          this.props.onChange(
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
            this.state.selectedOptions,
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            this.state.selectedSuboptions,
          ),
      );
    }
  }

  handleSuboptionClicked(suboptionValue: $TSFixMe, isChecked: $TSFixMe) {
    const optionValue = this.suboptionsToOptionMap[suboptionValue];
    if (isChecked) {
      this.setState(
        prevState => {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
          if (!prevState.selectedSuboptions[optionValue]) {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            prevState.selectedSuboptions[optionValue] = [];
          }
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
          prevState.selectedSuboptions[optionValue].push(suboptionValue);
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
          return { selectedSuboptions: prevState.selectedSuboptions };
        },
        () =>
          this.props.onChange(
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
            this.state.selectedOptions,
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            this.state.selectedSuboptions,
          ),
      );
    } else {
      this.setState(
        prevState => {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
          if (prevState.selectedSuboptions[optionValue]) {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            const suboptions = prevState.selectedSuboptions[optionValue].filter(
              (value: $TSFixMe) => value !== suboptionValue,
            );
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            prevState.selectedSuboptions[optionValue] = suboptions;
          }
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
          return { selectedSuboptions: prevState.selectedSuboptions };
        },
        () =>
          this.props.onChange(
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
            this.state.selectedOptions,
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
            this.state.selectedSuboptions,
          ),
      );
    }
  }

  handleItemClicked(event: $TSFixMe) {
    event.stopPropagation();
  }

  getNumberOfSelectedOptions() {
    let suboptionCount = 0;
    this.props.options.forEach((option: $TSFixMe) => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
      suboptionCount += (this.state.selectedSuboptions[option.value] || [])
        .length;
    });
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
    return this.state.selectedOptions.length + suboptionCount;
  }

  renderItem(
    value: $TSFixMe,
    text: $TSFixMe,
    checked: $TSFixMe,
    callback: $TSFixMe,
  ) {
    const { boxed } = this.props;
    return (
      <CheckboxItem
        boxed={boxed}
        key={value}
        value={value}
        label={text}
        checked={checked}
        onOptionClick={callback}
      />
    );
  }

  isOptionChecked(optionValue: $TSFixMe) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedOptions' does not exist on type ... Remove this comment to see the full error message
    return this.state.selectedOptions.indexOf(optionValue) > -1;
  }

  isSuboptionChecked(optionValue: $TSFixMe, suboptionValue: $TSFixMe) {
    return (
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedSuboptions' does not exist on ty... Remove this comment to see the full error message
      (this.state.selectedSuboptions[optionValue] || []).indexOf(
        suboptionValue,
      ) > -1
    );
  }

  renderItems() {
    const items: $TSFixMe = [];
    this.props.options.forEach((option: $TSFixMe) => {
      items.push(
        this.renderItem(
          option.value,
          option.text,
          this.isOptionChecked(option.value),
          this.handleOptionClicked,
        ),
      );
      (option.suboptions || []).forEach((suboption: $TSFixMe) => {
        items.push(
          this.renderItem(
            suboption.value,
            `${option.text} - ${suboption.text}`,
            this.isSuboptionChecked(option.value, suboption.value),
            this.handleSuboptionClicked,
          ),
        );
      });
    });
    return items;
  }

  renderLabel() {
    const {
      disabled,
      disableMarginRight,
      label,
      placeholder,
      rounded,
      useDropdownLabelCounter,
    } = this.props;

    const numberOfSelectedOptions = this.getNumberOfSelectedOptions();

    const labelText =
      numberOfSelectedOptions > 0 && label ? label + ":" : label;

    const labelCounter = numberOfSelectedOptions > 0 && (
      <DropdownLabel
        className={cs.dropdownLabel}
        disabled={disabled}
        text={String(numberOfSelectedOptions)}
      />
    );

    const numSelectedText =
      !useDropdownLabelCounter && numberOfSelectedOptions > 0
        ? `${String(numberOfSelectedOptions)} selected`
        : null;

    return (
      <DropdownTrigger
        className={cs.dropdownTrigger}
        disableMarginRight={disableMarginRight}
        label={labelText}
        rounded={rounded}
        placeholder={placeholder}
        value={useDropdownLabelCounter ? labelCounter : numSelectedText}
      />
    );
  }

  render() {
    const otherProps = omit(
      [
        "boxed",
        "selectedOptions",
        "selectedSuboptions",
        "label",
        "rounded",
        "onChange",
        "options",
        // This component needs to implement the itemSearchStrings prop before search will work.
        // Manually disable the search prop for now.
        "search",
        "disableMarginRight",
        "placeholder",
        "useDropdownLabelCounter",
      ],
      this.props,
    );

    return (
      <BareDropdown
        className={cs.multipleNestedDropdown}
        floating
        arrowInsideTrigger
        {...otherProps}
        trigger={this.renderLabel()}
        items={this.renderItems()}
        closeOnClick={false}
      />
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
MultipleNestedDropdown.defaultProps = {
  disableMarginRight: false,
  selectedOptions: [],
  selectedSuboptions: {},
  useDropdownLabelCounter: true,
};

export default MultipleNestedDropdown;
