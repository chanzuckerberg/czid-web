import cx from "classnames";
import { Icon, ButtonIcon } from "czifui";
import { startCase } from "lodash/fp";
import React from "react";

import BasicPopup from "~/components/BasicPopup";
import LiveSearchBox from "~ui/controls/LiveSearchBox";
import Tabs from "~ui/controls/Tabs";
import Label from "~ui/labels/Label";

import cs from "./discovery_header.scss";

interface DiscoveryHeaderProps {
  currentTab?: string;
  domain: string;
  filterCount?: number;
  onFilterToggle?: $TSFixMeFunction;
  onStatsToggle?: $TSFixMeFunction;
  onSearchEnterPressed?: $TSFixMeFunction;
  onSearchResultSelected?: $TSFixMeFunction;
  onSearchTriggered?: $TSFixMeFunction;
  onTabChange?: $TSFixMeFunction;
  searchValue?: string;
  showFilters?: boolean;
  showStats?: boolean;
  tabs: Array<
    | string
    | {
        value: string;
        label: JSX.Element;
      }
  >;
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
}: DiscoveryHeaderProps) => {
  const handleSearchResultSelected = ({ currentEvent, result }: $TSFixMe) => {
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
    let sdsTaxonFilterData = {};
    switch (category) {
      case "taxon": {
        value = result.taxid;
        // eslint-disable-next-line  no-undef
        const { taxid: id, level, title: name } = result;
        sdsTaxonFilterData = { id, level, name };
        break;
      }
      case "sample": {
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

  const handleSearchEnterPressed = ({ value }: $TSFixMe) => {
    const search = value;
    onSearchEnterPressed && onSearchEnterPressed(search);
  };

  const disableSidebars = currentTab === "visualizations";

  return (
    <div className={cs.header}>
      <div
        className={cx(cs.filtersTrigger, disableSidebars && cs.disabled)}
        onClick={disableSidebars ? undefined : onFilterToggle}
      >
        <BasicPopup
          trigger={
            <div>
              <ButtonIcon
                sdsSize="large"
                sdsType="primary"
                active={showFilters}
                disabled={disableSidebars}
              >
                <Icon
                  sdsIcon="slidersHorizontal"
                  sdsSize="xl"
                  sdsType="iconButton"
                />
              </ButtonIcon>
              {!disableSidebars && (
                <Label
                  className={cs.filtersCounter}
                  circular
                  text={filterCount}
                />
              )}
            </div>
          }
          content={
            disableSidebars ? (
              <div className={cs.popupText}>
                Filters
                <div className={cs.popupSubtitle}>
                  Not available on this tab
                </div>
              </div>
            ) : (
              "Filters"
            )
          }
          basic={false}
          mouseEnterDelay={600}
          mouseLeaveDelay={200}
          position={disableSidebars ? "top left" : "bottom center"}
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
      <Tabs
        className={cs.tabs}
        tabs={tabs}
        value={currentTab}
        onChange={onTabChange}
        hideBorder
      />
      <div className={cs.blankFill} />
      <div
        className={cx(cs.statsTrigger, disableSidebars && cs.disabled)}
        onClick={disableSidebars ? undefined : onStatsToggle}
      >
        <BasicPopup
          trigger={
            <div>
              <ButtonIcon
                sdsSize="large"
                sdsType="primary"
                active={showStats}
                disabled={disableSidebars}
              >
                <Icon
                  sdsIcon="infoSpeechBubble"
                  sdsSize="xl"
                  sdsType="iconButton"
                />
              </ButtonIcon>
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
