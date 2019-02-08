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
    window.addEventListener("resize", this.adjustIndicator);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.adjustIndicator();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.adjustIndicator);
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
    const { className, hideBorder, onChange, value, tabs } = this.props;
    const { indicatorLeft, indicatorWidth } = this.state;

    // Normalize tab format since we accept both an array of strings
    // or an array of objects with value and label attributes
    this._normalizedTabs = tabs.map(tab => {
      return typeof tab === "string" ? { value: tab, label: tab } : tab;
    });

    return (
      <div className={cx(cs.tabs, className)}>
        <div className={cx(cs.tabWrapper)}>
          {this._normalizedTabs.map(tab => (
            <div
              key={tab.value}
              ref={c => (this._tabs[tab.value] = c)}
              onClick={() => onChange(tab.value)}
              className={cx(cs.tab, value === tab.value && cs.selected)}
            >
              {tab.label}
            </div>
          ))}
          <div
            className={cs.indicator}
            style={{ left: indicatorLeft, width: indicatorWidth }}
          />
        </div>
        {hideBorder && <div className={cs.tabBorder} />}
      </div>
    );
  }
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired
      })
    ])
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  className: PropTypes.string,
  hideBorder: PropTypes.bool
};

export default Tabs;
