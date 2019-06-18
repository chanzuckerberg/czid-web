import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";

import { Menu, MenuItem } from "~ui/controls/Menu";

import cs from "./map_toggle.scss";

const DISPLAYS = ["table", "map"];

class MapToggle extends React.Component {
  render() {
    const { currentDisplay, onDisplaySwitch } = this.props;
    return (
      <div className={cs.displaySwitcher}>
        <Menu compact className={cs.switcherMenu}>
          {DISPLAYS.map(display => (
            <MenuItem
              className={cs.menuItem}
              active={currentDisplay === display}
              onClick={() => onDisplaySwitch(display)}
              key={`item-${display}`}
            >
              <i
                className={cx(
                  "fa",
                  display === "map" ? "fa-globe" : "fa-list-ul",
                  cs.icon
                )}
              />
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  }
}

MapToggle.propTypes = {
  currentDisplay: PropTypes.string,
  onDisplaySwitch: PropTypes.func,
};

export default MapToggle;
