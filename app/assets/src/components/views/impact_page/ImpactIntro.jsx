import React from "react";
import ImpactMap from "~/images/impact_page/ImpactMap.svg";
import IconBiohubLogo from "~/images/impact_page/logo-cz-biohub-color.png";
import IconCziLogoColor from "~/images/impact_page/logo-czi-color.png";
import IconGatesFoundationLogo from "~/images/impact_page/logo-gates-foundation.png";

import cs from "./ImpactIntro.scss";

const ImpactIntro = () => {
  return (
    <div className={cs.introContainer}>
      <div className={cs.introTextWrap}>
        <h2>CZ ID Around the World</h2>
        <p>
          Together with the Bill & Melinda Gates Foundation Grand Challenges
          Explorations initiative, we are partnering with global health workers
          throughout the developing world to identify unknown causes of
          infectious diseases and to enable broader access to CZ ID.
        </p>
        <span>In partnership with</span>
        <div className={cs.logoLinkContainer}>
          {/* logo links here */}
          <a
            className={cs.logoLink}
            href="https://www.czbiohub.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src={IconBiohubLogo} alt="" />
          </a>
          <a
            className={cs.logoLink}
            href="https://chanzuckerberg.com/"
            target="_blank"
            rel="noreferrer"
          >
            <img src={IconCziLogoColor} alt="" />
          </a>
          <a
            className={cs.logoLink}
            href="https://www.gatesfoundation.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src={IconGatesFoundationLogo} alt="" />
          </a>
        </div>
      </div>
      <div className={cs.mapContainer}>
        <img className={cs.impactMap} src={ImpactMap} alt="" />
      </div>
    </div>
  );
};

export default ImpactIntro;
