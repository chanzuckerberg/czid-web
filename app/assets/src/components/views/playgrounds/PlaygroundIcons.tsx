import cx from "classnames";
import { values } from "lodash/fp";
import React from "react";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { ICONS_TAXONOMY } from "~ui/icons";
import { ILLUSTRATIONS } from "~ui/illustrations";
import cs from "./playground_icons.scss";

class PlaygroundIcons extends React.Component {
  render() {
    const customIcons = values(ICONS_TAXONOMY.CUSTOM).map(IconComponent => (
      <IconComponent key={IconComponent.name} className={cs.icon} />
    ));
    const fontAwesomeIcons = values(ICONS_TAXONOMY.FONT_AWESOME).map(
      IconComponent => (
        <IconComponent key={IconComponent.name} className={cs.icon} />
      ),
    );
    const logoIcons = values(ICONS_TAXONOMY.LOGO).map(IconComponent => (
      <IconComponent key={IconComponent.name} className={cs.logoIcon} />
    ));
    const logoReversedIcons = values(ICONS_TAXONOMY.LOGO_REVERSED).map(
      IconComponent => (
        <IconComponent
          key={IconComponent.name}
          className={cx(cs.icon, cs.logoReversedIcon)}
        />
      ),
    );
    const illustrations = values(ILLUSTRATIONS).map(IconComponent => (
      <IconComponent key={IconComponent.name} className={cs.logoIcon} />
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
              key={iconInstance.type.name}>
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
          {logoReversedIcons.map(iconInstance => (
            <div className={cs.iconContainer} key={iconInstance.type.name}>
              {iconInstance}
              <span className={cs.iconLabel}>{iconInstance.type.name}</span>
            </div>
          ))}
        </div>
        <div className={cs.title}>Illustrations</div>
        <div className={cs.playgroundIcons}>
          {illustrations.map(iconInstance => (
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
