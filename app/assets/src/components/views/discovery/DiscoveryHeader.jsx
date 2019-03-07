import React from "react";
import PropTypes from "prop-types";
import FiltersIcon from "~ui/icons/FiltersIcon";
import Label from "~/components/ui/labels/Label";
import Tabs from "~ui/controls/Tabs";
import SearchBox from "~ui/controls/SearchBox";
import cs from "./discovery_header.scss";

class DiscoveryHeader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: this.props.initialTab || this.props.tabs[0].value
    };
  }

  handleTabChange = tab => {
    const { onTabChange } = this.props;
    this.setState({
      currentTab: tab
    });
    onTabChange(tab);
  };

  handleSuggestSelect = (_, { result }) => {
    console.log("DiscoveryHeader:handleSuggestSelect", result);
  };

  handleEnter = evt => {
    console.log(
      "DiscoveryHeader:handleEnter - ?",
      evt,
      evt.target.value,
      evt.key
    );
  };

  render() {
    const { filterCount, onFilterToggle, onStatsToggle, tabs } = this.props;
    const { currentTab } = this.state;

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
            onResultSelect={this.handleResultSelect}
            onEnter={this.handleSearch}
            initialValue=""
            placeholder="Search"
          />
        </div>
        <Tabs
          className={cs.tabs}
          tabs={tabs}
          value={currentTab}
          onChange={this.handleTabChange}
          hideBorder
        />
        <div className={cs.blankFill} />
        <div className={cs.statsTrigger} onClick={onStatsToggle}>
          <FiltersIcon className={cs.statsIcon} />
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
  initialTab: PropTypes.string,
  onTabChange: PropTypes.func,
  onFilterToggle: PropTypes.func,
  onStatsToggle: PropTypes.func
};

export default DiscoveryHeader;
