import cx from "classnames";
import React from "react";

import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import Dropdown from "./Dropdown";

import cs from "./subtext_dropdown.scss";

interface SubtextDropdownProps {
  className?: string;
  menuClassName?: string;
  options: {
    value?: string | number;
    text: string;
    subtext: string;
    disabled?: boolean;
    tooltip?: string;
  }[];
  onChange: $TSFixMeFunction;
  initialSelectedValue?: string | number;
  nullLabel?: string;
}

class SubtextDropdown extends React.Component<SubtextDropdownProps> {
  renderMenuItem(option: $TSFixMe) {
    const trigger = (
      // @ts-expect-error Item does not exist on BareDropdown
      <BareDropdown.Item
        onClick={(e: $TSFixMe) => {
          if (option.disabled) {
            e.stopPropagation();
          }
        }}
        className={cx(cs.option, option.disabled && cs.disabledOption)}
        data-testid={`dropdown-${option.text
          .replace("/ /g", "")
          .toLowerCase()}`}
      >
        <div className={cs.optionText}>{option.text}</div>
        <div className={cs.optionSubtext}>{option.subtext}</div>
        {/* @ts-expect-error Item does not exist on BareDropdown */}
      </BareDropdown.Item>
    );
    if (option.tooltip) {
      return (
        <ColumnHeaderTooltip
          trigger={trigger}
          content={option.tooltip}
          position="top center"
          mouseEnterDelay={600}
        />
      );
    } else {
      return trigger;
    }
  }

  renderMenuItems() {
    const { options } = this.props;

    const dropdownOptions = options.map((option: $TSFixMe) => ({
      text: option.text,
      value: option.value,
      subtext: option.subtext,

      customNode: option.customNode
        ? option.customNode
        : this.renderMenuItem(option),
    }));
    return dropdownOptions;
  }

  render() {
    const renderedMenuItems = this.renderMenuItems();
    const {
      className,
      initialSelectedValue,
      menuClassName,
      onChange,
      nullLabel,
      ...props
    } = this.props;

    return (
      <Dropdown
        {...props}
        className={className}
        menuClassName={menuClassName}
        options={renderedMenuItems}
        value={initialSelectedValue}
        onChange={onChange}
        nullLabel={nullLabel}
        usePortal
        withinModal={true}
      />
    );
  }
}

export default SubtextDropdown;
