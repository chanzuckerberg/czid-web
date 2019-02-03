import React from "react";
import PropTypes from "prop-types";
import Tabs from "~ui/controls/Tabs";
import cs from "./discovery_header.scss";

class DiscoveryHeader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: this.props.initialTab || this.props.tabs[0].value
    };
  }

  render() {
    const { tabs, onTabChange } = this.props;
    const { currentTab } = this.state;

    return (
      <Tabs
        className={cs.tabs}
        tabs={tabs}
        value={currentTab}
        onChange={onTabChange}
      />
    );
  }
}

DiscoveryHeader.propTypes = {
  currentTab: PropTypes.string,
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
  onTabChange: PropTypes.func
};

export default DiscoveryHeader;
