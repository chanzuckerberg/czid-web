import cx from "classnames";
import { isNil } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { MetadataValue } from "~/interface/shared";
import BareDropdown from "./BareDropdown";
import DropdownTrigger from "./common/DropdownTrigger";
import cs from "./dropdown.scss";

interface DropdownProps {
  className?: string;
  menuClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  erred?: boolean;
  floating?: boolean;
  scrolling?: boolean;
  fluid?: boolean;
  rounded?: boolean;
  label?: string;
  options: {
    text?: string;
    value?: string | number;
    // Optional node element will be rendered instead of text.
    // Text will still be used in the <DropdownTrigger>
    customNode?: React.ReactNode;
    subtext?: string;
  }[];
  // Custom props for rendering items
  items?: React.ReactNode[];
  // If search is true, and you provide pre-rendered "items" instead of "options",
  // you must also provide a list of strings to search by.
  itemSearchStrings?: string[];
  onChange: (val: string | number, displayName: string) => void;
  onClick?: (e: unknown) => void;
  value?: string | number | MetadataValue;
  search?: boolean;
  menuLabel?: string;
  // Optional header that displays between the search box and the options.
  optionsHeader?: React.ReactNode;
  usePortal?: boolean;
  direction?: "left" | "right";
  withinModal?: boolean;
  onFilterChange?: (query: unknown) => void;
  showNoResultsMessage?: boolean;
  showSelectedItemSubtext?: boolean;
  // Don't show the no results message if search options are still loading.
  // TODO(mark): Visually indicate that search options are loading even if
  // there are old search results to display.
  isLoadingSearchOptions?: boolean;
  nullLabel?: string;
}

const Dropdown = ({
  value: propsValue,
  options,
  onChange,
  nullLabel,
  label,
  showSelectedItemSubtext,
  rounded,
  placeholder,
  erred,
  disabled,
  fluid,
  usePortal,
  withinModal,
  menuLabel,
  search,
  menuClassName,
  className,
  items,
  itemSearchStrings,
  onFilterChange,
  showNoResultsMessage,
  isLoadingSearchOptions,
  direction,
  optionsHeader,
  onClick,
}: DropdownProps) => {
  const [value, setValue] = useState(propsValue ?? null);
  const [labels, setLabels] = useState({});
  const [subtexts, setSubtexts] = useState({});

  useEffect(() => {
    buildLabels();
  }, [options]);

  useEffect(() => {
    // Guard against NaN values
    if (!Number.isNaN(value)) {
      setValue(value);
    }
  }, [value]);

  const buildLabels = () => {
    setLabels(
      options.reduce((labelMap, option) => {
        labelMap[option.value.toString()] = option.text;
        return labelMap;
      }, {}),
    );
    setSubtexts(
      options.reduce((subtextMap, option) => {
        subtextMap[option.value.toString()] = option.subtext;
        return subtextMap;
      }, {}),
    );
  };

  const handleOnChange = (newValue: string) => {
    setValue(newValue);
    onChange(newValue, labels[newValue.toString()]);
  };

  const renderTrigger = () => {
    let text: string;

    if (!isNil(value)) {
      text = labels[value.toString()];
    } else if (nullLabel) {
      text = nullLabel;
    }

    const labelText = label && text ? `${label}:` : label;
    const itemSubtext =
      showSelectedItemSubtext && !isNil(value)
        ? subtexts[value.toString()]
        : "";
    return (
      <DropdownTrigger
        label={labelText}
        itemSubtext={itemSubtext}
        value={text}
        rounded={rounded}
        className={cs.dropdownTrigger}
        placeholder={placeholder}
        erred={erred}
      />
    );
  };

  return (
    <BareDropdown
      className={cx(cs.dropdown, className)}
      arrowInsideTrigger
      disabled={disabled}
      fluid={fluid}
      options={options}
      value={value}
      search={search}
      menuLabel={menuLabel}
      floating
      onChange={handleOnChange}
      trigger={renderTrigger()}
      usePortal={usePortal}
      direction={direction}
      withinModal={withinModal}
      items={items}
      itemSearchStrings={itemSearchStrings}
      onFilterChange={onFilterChange}
      optionsHeader={optionsHeader}
      showNoResultsMessage={showNoResultsMessage}
      isLoadingSearchOptions={isLoadingSearchOptions}
      menuClassName={menuClassName}
      onClick={onClick}
    />
  );
};

export default Dropdown;
