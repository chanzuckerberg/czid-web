import React, { useRef, useState } from "react";
import { WHITE_PAPER_LINK } from "~/components/utils/documentationLinks";
import WhitePaperImage from "~/images/landing_page/white-paper.svg";
import CtaButton from "./CtaButton";
import CtaButtonStyles from "./CtaButton.scss";
import cs from "./WhitePaper.scss";

const WhitePaper = () => {
  const citationAlertText = useRef<HTMLSpanElement>(null);
  const [timeoutActive, setTimeoutActive] = useState(false);

  const copyCitation = () => {
    navigator.clipboard.writeText(
      `Kalantar, Katrina L., et al. "IDseq—An open source cloud-based pipeline and analysis service for metagenomic pathogen detection and monitoring." Gigascience 9.10 (2020)`,
    );
  };

  const citationAlert = () => {
    const citationAlertTimeout = setTimeout(() => {
      if (citationAlertText.current) {
        citationAlertText.current.style.opacity = "0";
        setTimeoutActive(false);
      }
    }, 1500);

    if (timeoutActive) {
      clearTimeout(citationAlertTimeout);
      setTimeoutActive(false);
    }

    if (citationAlertText.current) {
      citationAlertText.current.style.opacity = "1";
      setTimeoutActive(true);
    }
  };

  return (
    <div className={cs.whitePaper__Inner}>
      <div className={cs.whitePaper__Inner_Image}>
        <img src={WhitePaperImage} alt="" />
      </div>
      <div className={cs.whitePaper__Inner_Copy}>
        <h2>Check out Our Paper in GigaScience</h2>
        <p>
          We describe CZ ID (formerly IDseq), its capabilities, and how the tool
          was validated. CZ ID is a continuously evolving service. For the most
          up to date analysis pipeline, check out{" "}
          <a
            href="https://github.com/chanzuckerberg/czid-workflows#workflows"
            target="_blank"
            rel="noopener noreferrer"
          >
            our Github page
          </a>
          .
        </p>
        <div className={cs.whitePaper__buttonRow}>
          <CtaButton
            className={`${CtaButtonStyles.filled} ${cs.solidBtn}`}
            text="Read Paper"
            aria-label="Read the CZ ID white paper (opens in new window)"
            linkUrl={WHITE_PAPER_LINK}
          />
          <div
            className={cs.copyCitationButton}
            onClick={() => {
              copyCitation();
              citationAlert();
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                copyCitation();
                citationAlert();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <CtaButton
              className={CtaButtonStyles.filled}
              text="Copy Citation"
              aria-label="Copy citation"
            />
            <span ref={citationAlertText}>Citation is copied to clipboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhitePaper;
