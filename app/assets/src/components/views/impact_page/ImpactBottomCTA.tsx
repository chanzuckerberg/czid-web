import React from "react";
import HeatmapImg from "~/images/landing_page/heatmap-screenshot-2x.png";
import cs from "./ImpactBottomCTA.scss";

const ImpactBottomCTA = () => {
  return (
    <div className={cs.ctaContainer}>
      <div className={cs.ctaText}>
        <h2>The free, cloud-based metagenomics platform for researchers</h2>
        <a
          className={cs.btnLink}
          href="https://airtable.com/shrBGT42xVBR6JAVv"
          target="_blank"
          rel="noreferrer"
        >
          request access
        </a>
      </div>
      <img width="300" src={HeatmapImg} alt="" />
    </div>
  );
};

export default ImpactBottomCTA;
