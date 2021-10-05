import React, { useState } from "react";
import IconMobileNavClose from "~/components/ui/icons/IconMobileNavClose";
import { LogoReversed } from "~ui/icons";
import cs from "./LandingHeaderV2.scss";

const LandingHeaderV2 = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMobileNav() {
    setMenuOpen(!menuOpen);
  }

  return (
    <div className={cs.header}>
      <a aria-label="Go to the IDseq homepage" href="/">
        <LogoReversed className={cs.headerLogo} />
      </a>
      <nav className={cs.nav}>
        <span className={cs.hideMobile}>
          <a
            className={cs.textLink}
            href="http://help.idseq.net"
            target="_blank"
            rel="noreferrer"
            aria-label="View the IDseq help page (opens in new window)"
          >
            Resources
          </a>
          <a
            className={cs.buttonLink}
            href="https://airtable.com/shrBGT42xVBR6JAVv"
            target="_blank"
            rel="noreferrer"
            aria-label="View the IDseq intro survey (opens in new window)"
          >
            Request Access
          </a>
          <a className={cs.buttonLink} href="/auth0/login">
            Sign in
          </a>
        </span>
        <div
          onClick={() => {
            toggleMobileNav();
          }}
          className={cs.hamburgerIcon}
        >
          <div className={cs.bar1}></div>
          <div className={cs.bar2}></div>
          <div className={cs.bar3}></div>
        </div>
        <div
          className={cs.mobileNav}
          style={menuOpen ? { width: "100%" } : { width: "0" }}
        >
          <div className={cs.mobileNavCloseContainer}>
            <span
              className={cs.mobileNavClose}
              onClick={() => {
                toggleMobileNav();
              }}
            >
              <IconMobileNavClose />
            </span>
          </div>
          <div className={cs.mobileNavLinkContainer}>
            <a
              className={cs.mobileNavLink}
              href="http://help.idseq.net"
              style={menuOpen ? { opacity: "1" } : { opacity: "0" }}
              target="_blank"
              rel="noreferrer"
              aria-label="View the IDseq help page (opens in new window)"
            >
              Resources
            </a>
            <div
              className={cs.mobileNavSeparator}
              style={menuOpen ? { opacity: "1" } : { opacity: "0" }}
            ></div>
            <a
              className={cs.mobileNavLink}
              href="/auth0/login"
              style={menuOpen ? { opacity: "1" } : { opacity: "0" }}
            >
              Sign In
            </a>
            <a
              className={cs.mobileNavLink}
              href="https://airtable.com/shrBGT42xVBR6JAVv"
              style={menuOpen ? { opacity: "1" } : { opacity: "0" }}
              target="_blank"
              rel="noreferrer"
              aria-label="View the IDseq intro survey (opens in new window)"
            >
              Request Access
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default LandingHeaderV2;
