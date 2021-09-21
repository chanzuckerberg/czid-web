import React from "react";
import IconBiohubLogo from "~/components/ui/icons/IconBiohubLogo";
import CZILogo from "~/images/landing_page/czi-logo-white.png";
import { LogoReversed } from "~ui/icons";
import cs from "./Footer.scss";

const Footer = () => {
  return (
    <div className={cs.footer}>
      <div className={cs.topNavContainer}>
        <a href="/">
          <LogoReversed />
        </a>
        <div className={cs.topNavMenu}>
          <a href="https://discoveridseq.com/vr">Video Tour</a>
          <a href="https://github.com/chanzuckerberg/idseq-workflows">Github</a>
          <a href="https://boards.greenhouse.io/chanzuckerberginitiative/jobs/2215049">Careers</a>
          <a href="http://help.idseq.net">Help Center</a>
        </div>
      </div>
      <div className={cs.bottomNavContainer}>
        <div className={cs.bottomNavMenu}>
          <p>&copy; Copyright Lorem ipsum.</p>
          <a href="http://idseq.net/privacy">Privacy</a>
          <span>|</span>
          <a href="http://idseq.net/terms">Terms</a>
          <span>|</span>
          <a href="mailto:help@idseq.net">Contact us</a>
        </div>
        <div className={cs.czLogoContainer}>
          <div>
            <a href="https://chanzuckerberg.com/">
              <img src={CZILogo} alt="" />
            </a>
          </div>
          <div className={cs.separator}></div>
          <div>
            <a href="https://www.czbiohub.org/">
              <IconBiohubLogo />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
