import React from "react";
import BasicPopup from "~/components/common/BasicPopup";
import { copyShortUrlToClipboard } from "~/helpers/url";
import { ShareButton } from "~ui/controls/buttons";
import cs from "../../primary_header_controls.scss";

export const ShareButtonPopUp = () => {
  const onShareClick = () => {
    copyShortUrlToClipboard();
  };
  return (
    <>
      <BasicPopup
        trigger={
          <ShareButton className={cs.controlElement} onClick={onShareClick} />
        }
        content="A shareable URL was copied to your clipboard!"
        on="click"
        hideOnScroll
      />
    </>
  );
};
