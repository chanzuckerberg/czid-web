import { ButtonIcon, Tabs } from "@czi-sds/components";
import cx from "classnames";
import { findIndex, startCase } from "lodash/fp";
import React from "react";
import BasicPopup from "~/components/BasicPopup";
import { FilterButtonWithCounter } from "~/components/ui/controls/buttons/FilterButtonWithCounter";
import { WorkflowType } from "~/components/utils/workflows";
import { TABS_TEMP_FIX_PROPS } from "~/interface/shared";
import LiveSearchBox from "~ui/controls/LiveSearchBox";
import { TAB_SAMPLES, TAB_VISUALIZATIONS } from "./constants";
import cs from "./discovery_header.scss";

interface DiscoveryHeaderProps {
  currentTab?: string;
  domain: string;
  filterCount?: number;
  onFilterToggle?: $TSFixMeFunction;
  onStatsToggle?: $TSFixMeFunction;
  onSearchEnterPressed?: (search: string) => void;
  onSearchResultSelected?: (
    result: {
      key: string;
      value: string | number;
      text: string;
      sdsTaxonFilterData:
        | {
            id: number;
            level: string;
            name: string;
          }
        | Record<string, never>;
    },
    currentEvent: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  onSearchTriggered?: (query: string) => Promise<$TSFixMe>;
  onTabChange?: $TSFixMeFunction;
  searchValue?: string;
  showFilters?: boolean;
  showStats?: boolean;
  tabs: Array<{
    value: string;
    label: JSX.Element;
  }>;
  workflow: WorkflowType;
}

const DiscoveryHeader = ({
  currentTab,
  domain,
  filterCount = 0,
  searchValue = "",
  onFilterToggle,
  onSearchEnterPressed,
  onSearchTriggered,
  onSearchResultSelected,
  onStatsToggle,
  onTabChange,
  showFilters,
  showStats,
  tabs,
  workflow,
}: DiscoveryHeaderProps) => {
  const handleSearchResultSelected = ({
    currentEvent,
    result,
  }: {
    currentEvent: React.MouseEvent<HTMLDivElement, MouseEvent>;
    result: {
      category: string;
      id: number;
      key: string;
      title: string;
      taxid?: number;
      description: string;
      sample_id?: number;
      project_id?: number;
      level?: "species" | "genus";
    };
  }) => {
    // TODO(tiago): refactor search suggestions endpoint to return standard format data
    // category "Taxon": key: "taxon", value: taxid, text: title
    // category "Project": key: "project", value: id, text: title
    // category "Sample": key: "sample", value: sample_ids[0], text: title
    // category "Location": key: "location", value: id, text: title
    // category "Host": key: "host", value: id, text: title
    // category "Sample Type": key: "tissue", value: id, text: title
    // TODO(jsheu): Replace location "v1"
    let category = result.category;
    if (category !== "locationV2") category = category.toLowerCase();
    let value = result.id;
    let sdsTaxonFilterData:
      | { id: number; level: string; name: string }
      | Record<string, never> = {};
    switch (category) {
      case "taxon": {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        value = result.taxid;
        // eslint-disable-next-line  no-undef
        const { taxid: id, level, title: name } = result;
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        sdsTaxonFilterData = { id, level, name };
        break;
      }
      case "sample": {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        value = result.sample_id;
        break;
      }
      default: {
        value = result.id;
        break;
      }
    }

    const parsedResult = {
      key: category,
      value: value,
      text: result.title,
      sdsTaxonFilterData,
    };

    onSearchResultSelected &&
      onSearchResultSelected(parsedResult, currentEvent);
  };

  const handleSearchEnterPressed = ({ value }: { value: string }) => {
    const search = value;
    onSearchEnterPressed && onSearchEnterPressed(search);
  };

  const disableSidebars =
    currentTab === TAB_VISUALIZATIONS ||
    (currentTab === TAB_SAMPLES && workflow === WorkflowType.BENCHMARK);

  return (
    <div className={cs.header}>
      <div className={cs.filterButtonContainer}>
        <FilterButtonWithCounter
          isDisabled={disableSidebars}
          filterCounter={filterCount}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          onFilterToggle={onFilterToggle}
          popupDisabledSubtitle="Not available on this tab"
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          showFilters={showFilters}
        />
      </div>
      <div className={cs.searchContainer}>
        {/* TODO(ihan): enable search box for snapshot view */}
        {domain !== "snapshot" && (
          <LiveSearchBox
            onSearchTriggered={onSearchTriggered}
            onResultSelect={handleSearchResultSelected}
            onEnter={handleSearchEnterPressed}
            placeholder={`Search ${startCase(domain)}...`}
            value={searchValue}
          />
        )}
      </div>
      <div className={cs.tabs}>
        {/* @ts-expect-error SDS is working on a fix for this in v19.0.1  */}
        <Tabs
          sdsSize="large"
          value={findIndex({ value: currentTab }, tabs)}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
          onChange={(_, selectedTabIndex) => onTabChange(selectedTabIndex)}
          {...TABS_TEMP_FIX_PROPS}
        >
          {tabs.map(tab => tab.label)}
        </Tabs>
      </div>
      <div className={cs.blankFill} />
      <div
        className={cx(cs.statsTrigger, disableSidebars && cs.disabled)}
        onClick={disableSidebars ? undefined : onStatsToggle}
      >
        <BasicPopup
          trigger={
            <div>
              <ButtonIcon
                data-testid="info-icon"
                sdsSize="large"
                sdsType="primary"
                sdsIcon="infoSpeechBubble"
                on={showStats}
                disabled={disableSidebars}
              />
            </div>
          }
          content={
            disableSidebars ? (
              <div className={cs.popupText}>
                Info
                <div className={cs.popupSubtitle}>
                  Not available on this tab
                </div>
              </div>
            ) : (
              "Info"
            )
          }
          basic={false}
          mouseEnterDelay={600}
          mouseLeaveDelay={200}
          position={disableSidebars ? "top right" : "bottom center"}
        />
      </div>
    </div>
  );
};

export default DiscoveryHeader;
