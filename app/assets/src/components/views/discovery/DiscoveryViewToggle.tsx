import cx from "classnames";
import React from "react";

import { Menu, MenuItem } from "~ui/controls/Menu";
import IconChartSmall from "~ui/icons/IconChartSmall";
import IconListSmall from "~ui/icons/IconListSmall";
import IconMapSmall from "~ui/icons/IconMapSmall";
import { DISPLAY_PLQC } from "./constants";

import cs from "./discovery_view_toggle.scss";

// TODO: replace strings here with contants
const MAP_DISPLAYS = ["table", "map"];
// Enable the PLQC toggle option if viewing a specific project.
const PROJECT_DISPLAYS = ["table", DISPLAY_PLQC, "map"];

interface DiscoveryViewToggleProps {
  currentDisplay?: string;
  onDisplaySwitch?: $TSFixMeFunction;
  includePLQC?: boolean;
}

const DiscoveryViewToggle = ({
  currentDisplay,
  onDisplaySwitch,
  includePLQC = false,
}: DiscoveryViewToggleProps) => {
  const displays = includePLQC ? PROJECT_DISPLAYS : MAP_DISPLAYS;
  return (
    <div className={cs.displaySwitcher}>
      <Menu compact className={cs.switcherMenu}>
        {displays.map(display => (
          <MenuItem
            className={cs.menuItem}
            active={currentDisplay === display}
            onClick={() => onDisplaySwitch(display)}
            key={`item-${display}`}
          >
            {display === "map" && (
              <IconMapSmall
                className={cx(cs.icon, currentDisplay === display && cs.active)}
              />
            )}
            {display === "table" && (
              <IconListSmall
                className={cx(cs.icon, currentDisplay === display && cs.active)}
              />
            )}
            {display === "plqc" && (
              <IconChartSmall
                className={cx(cs.icon, currentDisplay === display && cs.active)}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default DiscoveryViewToggle;
