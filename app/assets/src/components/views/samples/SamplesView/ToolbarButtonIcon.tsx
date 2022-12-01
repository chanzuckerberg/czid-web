// ToolbarButtonIcons are used at the top of the Samples View table.

import { ButtonIcon } from "czifui";
import React from "react";
import BasicPopup from "~/components/BasicPopup";

import cs from "./toolbar_button_icon.scss";

export default function ToolbarButtonIcon({
  className,
  icon,
  popupText,
  popupSubtitle,
  disabled,
  onClick,
  popperDependencies,
}: ToolbarButtonIconProps) {
  const iconWrapper = (
    <div className={className}>
      <ButtonIcon
        sdsSize="large"
        sdsType="primary"
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
      >
        {icon}
      </ButtonIcon>
    </div>
  );

  if (!popupText) {
    return iconWrapper;
  }

  return (
    <BasicPopup
      trigger={iconWrapper}
      content={
        <div className={cs.popupText}>
          {popupText}
          <div className={cs.popupSubtitle}>{popupSubtitle}</div>
        </div>
      }
      position="top center"
      basic={false}
      popperDependencies={popperDependencies}
    />
  );
}

interface ToolbarButtonIconProps {
  className: string;
  icon: $TSFixMe;
  popupText: string;
  popupSubtitle?: string;
  disabled?: boolean;
  onClick?: $TSFixMeFunction; // onClick does not need to be present if disabled is true.
  // The popup will re-render and re-position whenever any value in this array changes.
  // Allows us to gracefully handle popups with changing content.
  popperDependencies?: string[];
}
