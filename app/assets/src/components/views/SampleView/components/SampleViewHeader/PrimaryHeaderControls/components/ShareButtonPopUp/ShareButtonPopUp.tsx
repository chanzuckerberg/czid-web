import React from "react";
import BasicPopup from "~/components/BasicPopup";
import { ShareButton } from "~ui/controls/buttons";
import cs from "../../primary_header_controls.scss";

export const ShareButtonPopUp = ({
  onShareClick,
}: {
  onShareClick: () => void;
}) => {
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
