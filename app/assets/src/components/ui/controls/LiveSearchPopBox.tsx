import cx from "classnames";
import { forEach, sumBy, values } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { BareDropdown } from "~ui/controls/dropdowns";
import Input from "~ui/controls/Input";
import cs from "./live_search_pop_box.scss";

type SearchResult = {
  title: string;
  name: number | string;
  description?: string;
  [key: string]: any;
};

interface SearchCategory {
  name: string;
  results: SearchResult[];
}

export interface SearchResults {
  [key: string]: SearchCategory;
}

interface LiveSearchPopBoxProps {
  className?: string;
  delayTriggerSearch?: number;
  inputClassName?: string;
  inputMode?: boolean;
  minChars?: number;
  onResultSelect?(params: any): void;
  onSearchTriggered?(query: string): SearchResults | Promise<SearchResults>;
  placeholder?: string;
  rectangular?: boolean;
  value?: string;
  icon?: string;
  shouldSearchOnFocus?: boolean;
}

const LiveSearchPopBox = ({
  className,
  delayTriggerSearch = 200,
  inputClassName,
  minChars = 2,
  placeholder = "Search",
  rectangular = false,
  inputMode = false,
  icon = "search",
  shouldSearchOnFocus = false,
  onResultSelect,
  onSearchTriggered,
  value,
}: LiveSearchPopBoxProps) => {
  const [latestTimerId, setLatestTimerId] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResults>({});
  const [inputValue, setInputValue] = useState<string>("");

  // If the value has changed, reset the input value.
  // Store the prevValue to detect whether the value has changed.
  useEffect(() => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setInputValue(value);
  }, [value]);

  const handleKeyDown = keyEvent => {
    // Pressing enter selects what they currently typed.
    if (keyEvent.key === "Enter" && inputMode) {
      handleResultSelect({
        result: inputValue,
        currentEvent: {},
      });
    }
  };

  const closeDropdown = () => {
    setIsLoading(false);
    setIsFocused(false);
  };

  const handleResultSelect = ({ currentEvent, result }) => {
    setInputValue(result.title);
    onResultSelect && onResultSelect({ currentEvent, result });
    closeDropdown();
  };

  const triggerSearch = async () => {
    const timerId = latestTimerId;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    const results = await onSearchTriggered(inputValue);

    if (timerId === latestTimerId) {
      setIsLoading(false);
      setResults(results);
    }
  };

  const handleSearchChange = value => {
    setInputValue(value);

    // check minimum requirements for value
    const parsedValue = value.trim();
    if (parsedValue.length >= minChars) {
      setIsFocused(true);
      setIsLoading(true);

      if (latestTimerId) {
        clearTimeout(latestTimerId);
      }

      const newTimerId = setTimeout(triggerSearch, delayTriggerSearch);
      setLatestTimerId(newTimerId);
    }
  };

  const renderSearchBox = () => (
    <div onFocus={handleFocus} onBlur={handleBlur}>
      <Input
        className={cx(
          cs.searchInput,
          rectangular && cs.rectangular,
          inputClassName,
        )}
        icon={icon}
        loading={isLoading}
        placeholder={placeholder}
        onChange={handleSearchChange}
        onKeyPress={handleKeyDown}
        value={inputValue}
        disableAutocomplete
      />
    </div>
  );

  const handleFocus = () => {
    if (hasEnoughChars() && shouldSearchOnFocus) {
      handleSearchChange(inputValue);
    }

    setIsFocused(true);
  };

  // If a user selects an option, handleResultSelect will run and update props.value before this function runs.
  // So inputValue will equal props.value when this function runs and onResultSelect will not be called, which is correct.
  const handleBlur = () => {
    // If the user has changed the input without selecting an option, select what they currently typed as plain-text.
    if (onResultSelect && inputValue !== value) {
      onResultSelect({ result: inputValue });
    }

    closeDropdown();
  };

  const buildItem = (categoryKey, result, index) => (
    <BareDropdown.Item
      key={`${categoryKey}-${result.name}`}
      text={
        <div className={cs.entry}>
          <div className={cs.title}>{result.title}</div>
          {result.description && (
            <div className={cs.description}>{result.description}</div>
          )}
        </div>
      }
      onMouseDown={currentEvent => {
        // use onMouseDown instead of onClick to work with handleBlur
        handleResultSelect({ currentEvent, result });
      }}
      value={`${categoryKey}-${index}`}
    />
  );

  const buildSectionHeader = name => (
    <div key={name} className={cs.category}>
      {name}
    </div>
  );

  const renderDropdownItems = () => {
    // @ts-expect-error Property 'convert' does not exist on type 'LodashForEach'.ts(2339)
    const uncappedForEach = forEach.convert({ cap: false });
    const items = [];
    uncappedForEach((category, key) => {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      items.push(buildSectionHeader(category.name));
      uncappedForEach((result, index) => {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        items.push(buildItem(key, result, index));
      }, category.results);
    }, results);

    return items;
  };

  const getResultsLength = () => {
    return sumBy(cat => cat?.results?.length, values(results));
  };

  const hasEnoughChars = () => inputValue?.trim()?.length >= minChars;
  const shouldOpen = getResultsLength() && isFocused && hasEnoughChars();

  return (
    <BareDropdown
      className={cx(
        cs.liveSearchPopBox,
        rectangular && cs.rectangular,
        className,
      )}
      fluid
      hideArrow
      items={renderDropdownItems()}
      onChange={handleResultSelect}
      open={!!shouldOpen}
      trigger={renderSearchBox()}
      usePortal
      withinModal
      disableAutocomplete={true}
    />
  );
};

export default LiveSearchPopBox;
