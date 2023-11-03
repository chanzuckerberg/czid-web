import cx from "classnames";
import { capitalize } from "lodash/fp";
import React from "react";
import BasicPopup from "~/components/BasicPopup";
import { Menu, MenuItem } from "~ui/controls/Menu";
import IconBarChartHorizontal3Small from "~ui/icons/IconBarChartHorizontal3Small";
import IconPercentageSmall from "~ui/icons/IconPercentageSmall";
import cs from "./bar_chart_toggle.scss";

interface BarChartToggleProps {
  currentDisplay?: string;
  onDisplaySwitch?: $TSFixMeFunction;
}

const BarChartToggle = ({
  currentDisplay,
  onDisplaySwitch,
}: BarChartToggleProps) => {
  const displays = ["count", "percentage"];

  return (
    <div className={cs.displaySwitcher}>
      <Menu compact className={cs.switcherMenu}>
        {displays.map(display => (
          <BasicPopup
            basic={false}
            position="top center"
            content={capitalize(display)}
            key={`popup-${display}`}
            trigger={
              <MenuItem
                className={cs.menuItem}
                active={currentDisplay === display}
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
                onClick={() => onDisplaySwitch(display)}
                key={`item-${display}`}
              >
                {display === "count" && (
                  <IconBarChartHorizontal3Small
                    className={cx(
                      cs.icon,
                      currentDisplay === display && cs.active,
                    )}
                  />
                )}
                {display === "percentage" && (
                  <IconPercentageSmall
                    className={cx(
                      cs.icon,
                      currentDisplay === display && cs.active,
                    )}
                  />
                )}
              </MenuItem>
            }
          />
        ))}
      </Menu>
    </div>
  );
};

export default BarChartToggle;
