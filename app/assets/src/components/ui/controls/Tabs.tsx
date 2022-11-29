import cx from "classnames";
import React from "react";
import cs from "./tabs.scss";

interface TabsProps {
  tabs: Array<
    | string
    | {
        value: string;
        label: JSX.Element;
      }
  >;
  onChange: $TSFixMeFunction;
  value?: string;
  className?: string;
  hideBorder?: boolean;
  tabStyling?: string;
}

interface TabsState {
  indicatorLeft: number;
  indicatorWidth: number;
}
class Tabs extends React.Component<TabsProps, TabsState> {
  _tabs: object;
  constructor(props) {
    super(props);
    this._tabs = {};

    this.state = {
      indicatorLeft: null,
      indicatorWidth: null,
    };
  }

  componentDidMount() {
    this.adjustIndicator();
    window.addEventListener("resize", this.adjustIndicator);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.value !== this.props.value ||
      prevProps.tabs !== this.props.tabs
    ) {
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
        indicatorWidth: tab.offsetWidth,
      });
    }
  };

  render() {
    const {
      className,
      hideBorder,
      onChange,
      value,
      tabs,
      tabStyling,
    } = this.props;
    const { indicatorLeft, indicatorWidth } = this.state;

    // Normalize tab format since we accept both an array of strings
    // or an array of objects with value and label attributes
    const normalizedTabs = tabs.map(tab => {
      return typeof tab === "string" ? { value: tab, label: tab } : tab;
    });
    return (
      <div className={cx(cs.tabs, className)}>
        <div className={cx(cs.tabWrapper)}>
          {normalizedTabs.map(tab => (
            <div
              key={tab.value}
              ref={c => (this._tabs[tab.value] = c)}
              onClick={() => onChange(tab.value)}
              className={cx(
                tabStyling || cs.tab,
                value === tab.value && cs.selected,
              )}
              data-testid={`${tab.value
                .replaceAll(" ", "-")
                .toLocaleLowerCase()}`}
            >
              {tab.label}
            </div>
          ))}
          <div
            className={cs.indicator}
            style={{ left: indicatorLeft, width: indicatorWidth }}
          />
        </div>
        {!hideBorder && <div className={cs.tabBorder} />}
      </div>
    );
  }
}

export default Tabs;
