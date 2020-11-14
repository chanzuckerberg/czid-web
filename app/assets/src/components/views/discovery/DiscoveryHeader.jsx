import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { startCase } from "lodash/fp";

import FiltersIcon from "~ui/icons/FiltersIcon";
import InfoPanelIcon from "~ui/icons/InfoPanelIcon";
import Label from "~ui/labels/Label";
import Tabs from "~ui/controls/Tabs";
import LiveSearchBox from "~ui/controls/LiveSearchBox";
import BasicPopup from "~/components/BasicPopup";
import { DISCOVERY_DOMAINS } from "./discovery_api";

import cs from "./discovery_header.scss";

class DiscoveryHeader extends React.Component {
  handleSearchResultSelected = ({ currentEvent, result }) => {
    const { onSearchResultSelected } = this.props;
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
    switch (category) {
      case "taxon": {
        value = result.taxid;
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
    };

    onSearchResultSelected &&
      onSearchResultSelected(parsedResult, currentEvent);
  };

  handleSearchEnterPressed = ({ value }) => {
    const { onSearchEnterPressed } = this.props;

    const search = value;
    onSearchEnterPressed && onSearchEnterPressed(search);
  };

  render() {
    const {
      currentTab,
      domain,
      filterCount,
      searchValue,
      onFilterToggle,
      onSearchTriggered,
      onStatsToggle,
      onTabChange,
      showFilters,
      showStats,
      tabs,
    } = this.props;

    let disableSidebars = currentTab === "visualizations";

    return (
      <div className={cs.header}>
        <div
          className={cx(cs.filtersTrigger, disableSidebars && cs.disabled)}
          onClick={disableSidebars ? undefined : onFilterToggle}
        >
          <BasicPopup
            trigger={
              <div>
                <FiltersIcon
                  className={cx(
                    cs.filtersIcon,
                    disableSidebars ? cs.disabledIcon : cs.icon,
                    !showFilters && cs.closed
                  )}
                />
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
              onResultSelect={this.handleSearchResultSelected}
              onEnter={this.handleSearchEnterPressed}
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
                <InfoPanelIcon
                  className={cx(
                    cs.statsIcon,
                    disableSidebars ? cs.disabledIcon : cs.icon,
                    !showStats && cs.closed
                  )}
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
  }
}

DiscoveryHeader.defaultProps = {
  filterCount: 0,
  searchValue: "",
};

DiscoveryHeader.propTypes = {
  currentTab: PropTypes.string,
  domain: PropTypes.oneOf(DISCOVERY_DOMAINS).isRequired,
  filterCount: PropTypes.number,
  onFilterToggle: PropTypes.func,
  onStatsToggle: PropTypes.func,
  onSearchEnterPressed: PropTypes.func,
  onSearchResultSelected: PropTypes.func,
  onSearchTriggered: PropTypes.func,
  onTabChange: PropTypes.func,
  searchValue: PropTypes.string,
  showFilters: PropTypes.bool,
  showStats: PropTypes.bool,
  tabs: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired,
      }),
    ])
  ).isRequired,
};

export default DiscoveryHeader;
