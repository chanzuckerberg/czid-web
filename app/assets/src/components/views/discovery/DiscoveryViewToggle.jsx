import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { Menu, MenuItem } from "~ui/controls/Menu";
import IconChartSmall from "~ui/icons/IconChartSmall";
import IconListSmall from "~ui/icons/IconListSmall";
import IconMapSmall from "~ui/icons/IconMapSmall";

import cs from "./discovery_view_toggle.scss";

const MAP_DISPLAYS = ["table", "map"];
// Enable the PLQC toggle option if viewing a specific project.
const PROJECT_DISPLAYS = ["table", "plqc", "map"];

class DiscoveryViewToggle extends React.Component {
  render() {
    const { currentDisplay, onDisplaySwitch, includePLQC } = this.props;
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
                  className={cx(
                    cs.icon,
                    currentDisplay === display && cs.active,
                  )}
                />
              )}
              {display === "table" && (
                <IconListSmall
                  className={cx(
                    cs.icon,
                    currentDisplay === display && cs.active,
                  )}
                />
              )}
              {display === "plqc" && (
                <IconChartSmall
                  className={cx(
                    cs.icon,
                    currentDisplay === display && cs.active,
                  )}
                />
              )}
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  }
}

DiscoveryViewToggle.defaultProps = {
  includePLQC: false,
};

DiscoveryViewToggle.propTypes = {
  currentDisplay: PropTypes.string,
  onDisplaySwitch: PropTypes.func,
  includePLQC: PropTypes.bool,
};

export default DiscoveryViewToggle;
