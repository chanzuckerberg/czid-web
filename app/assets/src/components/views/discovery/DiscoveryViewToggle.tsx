import cx from "classnames";
import { kebabCase } from "lodash/fp";
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
  onDisplaySwitch?: (display: string) => void;
  includePLQC?: boolean;
}

const DiscoveryViewToggle = ({
  currentDisplay,
  onDisplaySwitch,
  includePLQC = false,
}: DiscoveryViewToggleProps) => {
  const displays = includePLQC ? PROJECT_DISPLAYS : MAP_DISPLAYS;
  return (
    <div data-testid="menu-icons" className={cs.displaySwitcher}>
      <Menu compact className={cs.switcherMenu}>
        {displays.map(display => (
          <MenuItem
            data-testid={`${kebabCase(display)}-view`}
            className={cs.menuItem}
            active={currentDisplay === display}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
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
