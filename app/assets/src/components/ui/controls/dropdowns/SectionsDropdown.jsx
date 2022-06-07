import cx from "classnames";
import { isEmpty, isNil } from "lodash/fp";
import { nanoid } from "nanoid";
import PropTypes from "prop-types";
import React from "react";

import DropdownTrigger from "~/components/ui/controls/dropdowns/common/DropdownTrigger";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";

import cs from "./subtext_dropdown.scss";

const SectionsDropdown = ({
  className,
  menuClassName,
  categories,
  itemIdToName,
  nullLabel,
  onChange,
  selectedValue,
  search,
  ...props
}) => {
  let { label, rounded, ...restProps } = props;
  const renderMenuItem = option => {
    const trigger = (
      <BareDropdown.Item
        className={cx(
          cs.option,
          cs.noMargins,
          option.disabled && cs.disabledOption,
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
            option.value === selectedValue && cs.selectedOption,
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

  const prepareSectionItems = () => {
    const items = [];
    const itemSearchStrings = [];
    const sections = {};

    Object.entries(categories).forEach(([category, categoryDetails]) => {
      const categoryName = categoryDetails.displayName;
      // Creates a mapping between the section and the itemsSearchStrings in that section.
      sections[categoryName] = new Set([]);

      const sectionItems = categoryDetails.options.map(option => {
        if (search) {
          sections[categoryName].add(option.text);
          itemSearchStrings.push(option.text);
        }
        return renderMenuItem(option);
      });

      if (isEmpty(sectionItems)) {
        sectionItems.push(
          renderEmptySectionMessage(categoryDetails.emptySectionMessage),
        );
      }

      const header = (
        <BareDropdown.Header
          content={categoryName}
          key={`${category}_header`}
        />
      );
      const divider = <BareDropdown.Divider key={`${category}_divider`} />;
      items.push(header, ...sectionItems, divider);
    });

    // Remove the last divider.
    items.pop();

    return { items, itemSearchStrings, sections };
  };

  const renderEmptySectionMessage = message => (
    <BareDropdown.Item
      className={cs.emptySection}
      flag="unsearchable"
      key={nanoid()}
    >
      <div className={cs.message}>{message}</div>
    </BareDropdown.Item>
  );

  const renderDropdownTrigger = () => {
    let text;
    if (!isNil(selectedValue)) {
      const value = selectedValue.toString();
      // If there is a mapping from the item's id to its name, lookup the name - otherwise use the value itself.
      text = !isEmpty(itemIdToName) ? itemIdToName[value] : value;
    } else if (nullLabel) {
      text = nullLabel;
    }

    return (
      <DropdownTrigger
        {...restProps}
        label={label ? label + ":" : ""}
        rounded={rounded}
        className={cs.dropdownTrigger}
        value={text}
      />
    );
  };

  return (
    <BareDropdown
      {...restProps}
      arrowInsideTrigger={true}
      className={className}
      trigger={renderDropdownTrigger()}
      menuClassName={menuClassName}
      search={search}
      {...prepareSectionItems()}
    />
  );
};

SectionsDropdown.propTypes = {
  className: PropTypes.string,
  menuClassName: PropTypes.string,
  categories: PropTypes.shape({
    displayName: PropTypes.string,
    emptyMessage: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        default: PropTypes.bool,
        disabled: PropTypes.bool,
        subtext: PropTypes.string,
        text: PropTypes.string.isRequired,
        tooltip: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
  }).isRequired,
  // Used to map the item to the item's name whenever the value of the item is not text.
  // e.g. BackgroundModel items' values are their numerical IDs however we want to display the names of the backgrounds,
  // so we do a lookup in itemIdToName to find the name of the background to display in the DropdownTrigger.
  itemIdToName: PropTypes.object,
  label: PropTypes.string,
  nullLabel: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  rounded: PropTypes.bool,
  selectedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  search: PropTypes.bool,
};

export default SectionsDropdown;
