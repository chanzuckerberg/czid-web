import React from "react";
import cx from "classnames";
import { values } from "lodash/fp";
import Icons from "~ui/icons";
import NarrowContainer from "~/components/layout/NarrowContainer";
import cs from "./playground_icons.scss";

class PlaygroundIcons extends React.Component {
  render() {
    const customIcons = values(Icons.CUSTOM).map(IconComponent => (
      <IconComponent className={cs.icon} /> /* eslint-disable-line */
    ));
    const fontAwesomeIcons = values(Icons.FONT_AWESOME).map(IconComponent => (
      <IconComponent className={cs.icon} /> /* eslint-disable-line */
    ));
    const logoIcons = values(Icons.LOGO).map(IconComponent => (
      <IconComponent /* eslint-disable-line */
        className={cx(cs.icon, cs.loadingIcon)}
      />
    ));

    return (
      <NarrowContainer>
        <div className={cs.title}>Custom SVG Icons</div>
        <div className={cs.playgroundIcons}>
          {customIcons.map(iconInstance => (
            <div className={cs.iconContainer} key={iconInstance.type.name}>
              {iconInstance}
              <span className={cs.iconLabel}>{iconInstance.type.name}</span>
            </div>
          ))}
        </div>
        <div className={cs.title}>Font-Awesome Icons</div>
        <div className={cs.playgroundIcons}>
          {fontAwesomeIcons.map(iconInstance => (
            <div
              className={cx(cs.iconContainer, cs.faIconContainer)}
              key={iconInstance.type.name}
            >
              <div className={cs.faIconContainer}>{iconInstance}</div>
              <span className={cs.iconLabel}>{iconInstance.type.name}</span>
            </div>
          ))}
        </div>
        <div className={cs.title}>Logo</div>
        <div className={cs.playgroundIcons}>
          {logoIcons.map(iconInstance => (
            <div className={cs.iconContainer} key={iconInstance.type.name}>
              {iconInstance}
              <span className={cs.iconLabel}>{iconInstance.type.name}</span>
            </div>
          ))}
        </div>
      </NarrowContainer>
    );
  }
}

export default PlaygroundIcons;
