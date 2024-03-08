import cx from "classnames";
import React, { useEffect, useRef, useState } from "react";
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

const Tabs = ({
  className,
  hideBorder,
  onChange,
  value,
  tabs,
  tabStyling,
}: TabsProps) => {
  const _tabs: object = useRef(null);

  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
  const [indicatorLeft, setIndicatorLeft] = useState<number>(null);
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
  const [indicatorWidth, setIndicatorWidth] = useState<number>(null);

  useEffect(() => {
    adjustIndicator();
    window.addEventListener("resize", adjustIndicator);
    return window.removeEventListener("resize", adjustIndicator);
  }, []);

  useEffect(() => {
    adjustIndicator();
  }, [value, tabs]);

  const adjustIndicator = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
    const tab = _tabs[value];
    if (tab) {
      setIndicatorLeft(tab.offsetLeft);
      setIndicatorWidth(tab.offsetWidth);
    }
  };

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
            ref={c => (_tabs[tab.value] = c)}
            onClick={() => onChange(tab.value)}
            className={cx(
              tabStyling || cs.tab,
              value === tab.value && cs.selected,
            )}
            data-testid={`${tab.value.replace(/ /g, "-").toLocaleLowerCase()}`}
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
};

export default Tabs;
