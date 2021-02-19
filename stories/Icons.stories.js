import React from "react";

import { ICONS_TAXONOMY } from "~ui/icons";
import NarrowContainer from "~/components/layout/NarrowContainer";
import cs from "./Icons.stories.scss";

export default {
  title: "Bases/Icons",
  component: SvgIcons,
  argTypes: {},
};

export const SvgIcons = () => {
  const customIcons = Object.values(
    ICONS_TAXONOMY.CUSTOM
  ).map(IconComponent => (
    <IconComponent key={IconComponent.name} className={cs.icon} />
  ));

  return (
    <NarrowContainer>
      <div className={cs.svgIcons}>
        {customIcons.map(iconInstance => (
          <div className={cs.iconContainer} key={iconInstance.type.name}>
            {iconInstance}
            <span className={cs.iconLabel}>{iconInstance.type.name}</span>
          </div>
        ))}
      </div>
    </NarrowContainer>
  );
};
