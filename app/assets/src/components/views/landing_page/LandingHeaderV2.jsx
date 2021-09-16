import React from "react";
import { LogoReversed } from "~ui/icons";
import cs from "./LandingHeaderV2.scss";

const LandingHeaderV2 = () => {
  return (
    <div className={cs.header}>
      <a href="/">
        <LogoReversed className={cs.headerLogo} />
      </a>
      <nav className={cs.nav}>
        <span className={cs.hideMobile}>
          <a className={cs.textLink} href="/">
            Resources
          </a>
          <a className={cs.buttonLink} href="/">
            Request Access
          </a>
        </span>
        <a className={cs.buttonLink} href="/">
          Sign in
        </a>
      </nav>
    </div>
  );
};

export default LandingHeaderV2;
