import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import cs from "./tabs.scss";

class Tabs extends React.Component {
  constructor(props) {
    super(props);
    this._tabs = {};
    this.state = {
      indicatorLeft: null,
      indicatorWidth: null
    };
  }

  componentDidMount() {
    this.adjustIndicator();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.value !== this.props.value) {
      this.adjustIndicator();
    }
  }

  adjustIndicator = () => {
    const tab = this._tabs[this.props.value];
    if (tab) {
      this.setState({
        indicatorLeft: tab.offsetLeft,
        indicatorWidth: tab.offsetWidth
      });
    }
  };

  render() {
    const { tabs, onChange, className } = this.props;
    const { indicatorLeft, indicatorWidth } = this.state;
    return (
      <div className={cx(cs.tabs, className)}>
        {tabs.map(tab => (
          <div
            key={tab}
            ref={c => (this._tabs[tab] = c)}
            onClick={() => onChange(tab)}
            className={cx(cs.tab, this.props.value === tab && cs.selected)}
          >
            {tab}
          </div>
        ))}
        <div className={cs.tabBorder}>
          <div
            className={cs.indicator}
            style={{ left: indicatorLeft, width: indicatorWidth }}
          />
        </div>
      </div>
    );
  }
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  className: PropTypes.string
};

export default Tabs;
