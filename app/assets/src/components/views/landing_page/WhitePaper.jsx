import React from "react";
import WhitePaperImage from "~/images/landing_page/white-paper.svg";
import { openUrlInNewTab } from "~utils/links";
import CtaButton from "./CtaButton";
import CtaButtonStyles from "./CtaButton.scss";
import cs from "./WhitePaper.scss";

const WhitePaper = () => {
  return (
    <div
      className={cs.whitePaper__Inner}
      onClick={() =>
        openUrlInNewTab(
          "https://academic.oup.com/gigascience/article/doi/10.1093/gigascience/giaa111/5918865",
        )
      }
    >
      <div className={cs.whitePaper__Inner_Image}>
        <img src={WhitePaperImage} alt="" />
      </div>
      <div className={cs.whitePaper__Inner_Copy}>
        <h2>
          Read the paper on how CZ ID reduces the barrier of entry to
          metagenomics
        </h2>
        <p>
          See how scientists, clinicians, and bioinformaticians can gain insight
          from mNGS datasets for both known and novel pathogens.
        </p>
        <CtaButton
          className={CtaButtonStyles.filled}
          text="Read the Paper"
          aria-label="Read the CZ ID white paper (opens in new window)"
        />
      </div>
    </div>
  );
};

export default WhitePaper;
