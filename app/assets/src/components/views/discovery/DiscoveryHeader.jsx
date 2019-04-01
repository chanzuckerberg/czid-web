import React from "react";
import PropTypes from "prop-types";
import FiltersIcon from "~ui/icons/FiltersIcon";
import InfoIcon from "~ui/icons/InfoIcon";
import Label from "~ui/labels/Label";
import Tabs from "~ui/controls/Tabs";
import SearchBox from "~ui/controls/SearchBox";
import cs from "./discovery_header.scss";
import cx from "classnames";

const SEARCH_CATEGORIES = [
  "taxon",
  "project",
  "sample",
  "location",
  "host",
  "tissue"
];
class DiscoveryHeader extends React.Component {
  handleSearchResultSelected = (currentEvent, { result }) => {
    const { onSearchResultSelected } = this.props;
    // TODO(tiago): refactor search suggestions endpoint to return standard format data
    // category "Taxon": key: "taxon", value: taxid, text: title
    // category "Project": key: "project", value: id, text: title
    // category "Sample": key: "sample", value: sample_ids[0], text: title
    // category "Location": key: "location", value: id, text: title
    // category "Host": key: "host", value: id, text: title
    // category "Tissue": key: "tissue", value: id, text: title
    const category = result.category.toLowerCase();
    let value = result.id;
    switch (category) {
      case "taxon": {
        value = result.taxid;
        break;
      }
      case "sample": {
        value = result.sample_ids[0];
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
      text: result.title
    };

    onSearchResultSelected &&
      onSearchResultSelected(parsedResult, currentEvent);
  };

  handleSearchEnterPressed = currentEvent => {
    const { onSearchEnterPressed } = this.props;

    const search = currentEvent.target.value;
    onSearchEnterPressed && onSearchEnterPressed(search);
  };

  render() {
    const {
      currentTab,
      filterCount,
      onFilterToggle,
      onStatsToggle,
      onTabChange,
      showFilters,
      showStats,
      tabs
    } = this.props;

    // TODO(tiago): consider constraining what categories to ask for in the search box.
    return (
      <div className={cs.header}>
        <div className={cs.filtersTrigger} onClick={onFilterToggle}>
          <FiltersIcon
            className={cx(cs.filtersIcon, cs.icon, !showFilters && cs.closed)}
          />
          <Label
            className={cs.filtersCounter}
            circular
            text={`${filterCount}`}
          />
        </div>
        <div className={cs.searchContainer}>
          <SearchBox
            category
            serverSearchAction="search_suggestions"
            serverSearchActionArgs={{ categories: SEARCH_CATEGORIES }}
            onResultSelect={this.handleSearchResultSelected}
            onEnter={this.handleSearchEnterPressed}
            initialValue=""
            placeholder="Search"
          />
        </div>
        <Tabs
          className={cs.tabs}
          tabs={tabs}
          value={currentTab}
          onChange={onTabChange}
          hideBorder
        />
        <div className={cs.blankFill} />
        <div className={cs.statsTrigger} onClick={onStatsToggle}>
          <InfoIcon
            className={cx(cs.statsIcon, cs.icon, !showStats && cs.closed)}
          />
        </div>
      </div>
    );
  }
}

DiscoveryHeader.defaultProps = {
  filterCount: 0
};

DiscoveryHeader.propTypes = {
  currentTab: PropTypes.string,
  filterCount: PropTypes.number,
  tabs: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired
      })
    ])
  ).isRequired,
  onFilterToggle: PropTypes.func,
  onStatsToggle: PropTypes.func,
  onSearchEnterPressed: PropTypes.func,
  onSearchResultSelected: PropTypes.func,
  onTabChange: PropTypes.func,
  showFilters: PropTypes.bool,
  showStats: PropTypes.bool
};

export default DiscoveryHeader;
