import React from "react";
import PropTypes from "prop-types";

import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import DropdownTrigger from "~/components/ui/controls/dropdowns/common/DropdownTrigger";

import cx from "classnames";
import cs from "./subtext_dropdown.scss";

const SectionsDropdown = ({
  className,
  menuClassName,
  categories,
  onChange,
  selectedValue,
  ...props
}) => {
  const renderMenuItem = option => {
    const trigger = (
      <BareDropdown.Item
        className={cx(
          cs.option,
          cs.noMargins,
          option.disabled && cs.disabledOption
        )}
        key={option.value}
        onClick={() => {
          if (!option.disabled) {
            onChange(option.value);
          }
        }}
      >
        <div
          className={cx(
            cs.optionText,
            option.value === selectedValue && cs.selectedOption
          )}
        >
          {option.text}
        </div>
        <div className={cs.optionSubtext}>{option.subtext}</div>
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
  };

  const renderDropdownItems = () => {
    let dropdownItems = [];

    Object.entries(categories).forEach(([category, categoryDetails]) => {
      dropdownItems.push(
        <div className={cs.header} key={`${category}_header`}>
          {categoryDetails.displayName}
        </div>
      );

      categoryDetails.options.map(option =>
        dropdownItems.push(renderMenuItem(option))
      );

      dropdownItems.push(
        <div className={cs.divider} key={`${category}_divider`} />
      );
    });

    // Remove the last divider.
    dropdownItems.pop();

    return dropdownItems;
  };

  const renderDropdownTrigger = () => {
    return (
      <DropdownTrigger
        {...props}
        className={cs.dropdownTrigger}
        value={selectedValue}
      />
    );
  };

  return (
    <BareDropdown
      {...props}
      arrowInsideTrigger={true}
      className={className}
      trigger={renderDropdownTrigger()}
      items={renderDropdownItems()}
      menuClassName={menuClassName}
    />
  );
};

SectionsDropdown.propTypes = {
  className: PropTypes.string,
  menuClassName: PropTypes.string,
  categories: PropTypes.shape({
    displayName: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        default: PropTypes.bool,
        disabled: PropTypes.bool,
        subtext: PropTypes.string,
        text: PropTypes.string.isRequired,
        tooltip: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  selectedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default SectionsDropdown;
