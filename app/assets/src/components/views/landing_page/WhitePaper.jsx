import React from "react";
import WhitePaperImage from "~/images/landing_page/white-paper.svg";
import CtaButton from "./CtaButton";
import CtaButtonStyles from "./CtaButton.scss";
import cs from "./WhitePaper.scss";

const WhitePaper = () => {
  return (
    <a
      className={cs.whitePaper__Inner}
      href="https://academic.oup.com/gigascience/article/doi/10.1093/gigascience/giaa111/5918865"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={cs.whitePaper__Inner_Image}>
        <img src={WhitePaperImage} alt="" />
      </div>
      <div className={cs.whitePaper__Inner_Copy}>
        <h2>
          Read the paper on how IDseq reduces the barrier of entry to
          metagenomics
        </h2>
        <p>
          See how scientists, clinicians, and bioinformaticians can gain insight
          from mNGS datasets for both known and novel pathogens.
        </p>
        <CtaButton className={CtaButtonStyles.filled} text="Read the Paper" />
      </div>
    </a>
  );
};

export default WhitePaper;
