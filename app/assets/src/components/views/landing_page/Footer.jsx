import React from "react";
import IconBiohubLogo from "~/components/ui/icons/IconBiohubLogo";
import IconCziLogo from "~/components/ui/icons/IconCziLogo";
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
          <div>
            <a href="http://idseq.net/privacy">Privacy</a>
            <span>|</span>
            <a href="http://idseq.net/terms">Terms</a>
            <span>|</span>
            <a href="mailto:help@idseq.net">Contact us</a>
          </div>
        </div>
        <div className={cs.czLogoContainer}>
          <div>
            <a className={cs.cziLogo} href="https://chanzuckerberg.com/">
              <IconCziLogo />
            </a>
          </div>
          <div className={cs.separator}></div>
          <div>
            <a className={cs.biohubLogo} href="https://www.czbiohub.org/">
              <IconBiohubLogo />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
