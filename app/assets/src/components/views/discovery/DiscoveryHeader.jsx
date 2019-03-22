import React from "react";
import PropTypes from "prop-types";
import FiltersIcon from "~ui/icons/FiltersIcon";
import InfoIcon from "~ui/icons/InfoIcon";
import Label from "~ui/labels/Label";
import Tabs from "~ui/controls/Tabs";
import SearchBox from "~ui/controls/SearchBox";
import cs from "./discovery_header.scss";

class DiscoveryHeader extends React.Component {
  handleSearchResultSelected = (_, { result }) => {
    const { onSearchResultSelected } = this.props;

    // TODO(tiago): refactor search suggestions endpoint to return standard format data
    // category "Taxon": key: "taxon", value: taxid, text: title
    // category "Project": key: "project", value: id, text: title
    // category "Sample": key: "sample", value: sample_ids[0], text: title
    // category "Location": key: "location", value: id, text: title
    // category "Host": key: "host", value: id, text: title
    // category "Tissue": key: "tissue", value: id, text: title
    // category "Uploader": key: "uploader", value: id[0], text: title
    const value = Array.isArray(result.id)
      ? result.id[0]
      : result.id ||
        result.taxid ||
        (result.sample_ids && result.sample_ids[0]);

    const parsedResult = {
      key: result.category.toLowerCase(),
      value: value,
      text: result.title
    };

    onSearchResultSelected && onSearchResultSelected(parsedResult);
  };

  render() {
    const {
      currentTab,
      filterCount,
      onSearchEnterPressed,
      onFilterToggle,
      onStatsToggle,
      onTabChange,
      tabs
    } = this.props;

    // TODO(tiago): consider constraining what categories to ask for in the search box.
    return (
      <div className={cs.header}>
        <div className={cs.filtersTrigger} onClick={onFilterToggle}>
          <FiltersIcon className={cs.filtersIcon} />
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
            onResultSelect={this.handleSearchResultSelected}
            onEnter={onSearchEnterPressed}
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
          <InfoIcon className={cs.statsIcon} />
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
  onTabChange: PropTypes.func
};

export default DiscoveryHeader;
