import React from "react";
import { trackEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { copyShortUrlToClipboard } from "~/helpers/url";
import { ShareButton } from "~ui/controls/buttons";
import cs from "../../primary_header_controls.scss";

export const ShareButtonPopUp = ({ sampleId }: { sampleId: number }) => {
  const onShareClick = () => {
    copyShortUrlToClipboard();
    trackEvent("SampleView_share-button_clicked", {
      sampleId,
    });
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
