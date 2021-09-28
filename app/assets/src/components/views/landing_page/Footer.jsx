import React from "react";
import IconBiohubLogo from "~/components/ui/icons/IconBiohubLogo";
import IconCziLogo from "~/components/ui/icons/IconCziLogo";
import { LogoReversed } from "~ui/icons";
import cs from "./Footer.scss";

const Footer = () => {
  return (
    <div className={cs.footer}>
      <div className={cs.topNavContainer}>
        <a aria-label="Go to the IDseq homepage" href="/">
          <LogoReversed />
        </a>
        <div className={cs.topNavMenu}>
          <a href="https://discoveridseq.com/vr">Experience IDseq&apos;s Impact</a>
          <a href="https://github.com/chanzuckerberg/idseq-workflows">Github</a>
          <a href="https://boards.greenhouse.io/chanzuckerberginitiative/jobs/2215049">Careers</a>
          <a href="http://help.idseq.net">Resources</a>
        </div>
      </div>
      <div className={cs.bottomNavContainer}>
        <div className={cs.bottomNavMenu}>
          <div>
            <a 
              href="http://idseq.net/privacy" 
              aria-label="View the IDseq privacy policy (opens in new window)" 
              target="_blank" 
              rel="noreferrer"
              >
              Privacy
            </a>
            <span>|</span>
            <a 
              href="http://idseq.net/terms"
              aria-label="View the IDseq terms of use (opens in new window)" 
              target="_blank" 
              rel="noreferrer"
              >
              Terms
            </a>
            <span>|</span>
            <a href="mailto:help@idseq.net">Contact us</a>
          </div>
        </div>
        <div className={cs.czLogoContainer}>
          <p>In partnership with:</p>
          <div className={cs.czLogoInnerContainer}>
            <div>
              <a 
                href="https://chanzuckerberg.com/"
                className={cs.cziLogo} 
                aria-label="View the Chan Zuckerberg Initiative website (opens in new window)" 
                target="_blank" 
                rel="noreferrer" 
                >
                <IconCziLogo />
              </a>
            </div>
            <div className={cs.separator}></div>
            <div>
              <a 
                href="https://www.czbiohub.org/"
                className={cs.biohubLogo} 
                aria-label="View the Chan Zuckerberg Biohub website (opens in new window)" 
                target="_blank" 
                rel="noreferrer" 
                >
                <IconBiohubLogo />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
