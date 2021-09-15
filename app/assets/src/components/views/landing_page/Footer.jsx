import React from "react";
import BiohubLogo from "~/images/landing_page/biohub-logo.svg";
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
          <a href="/">Video Tour</a>
          <a href="/">Github</a>
          <a href="/">Careers</a>
          <a href="/">Help Center</a>
        </div>
      </div>
      <div className={cs.bottomNavContainer}>
        <div className={cs.bottomNavMenu}>
          <p>&copy; Copyright Lorem ipsum.</p>
          <a href="/">Privacy</a>
          <span>|</span>
          <a href="/">Terms</a>
          <span>|</span>
          <a href="/">Contact us</a>
        </div>
        <div className={cs.czLogoContainer}>
          <div>
            <a href="/">
              <img src={CZILogo} alt="" />
            </a>
          </div>
          <div className={cs.separator}></div>
          <div>
            <a href="/">
              <img src={BiohubLogo} alt="" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
