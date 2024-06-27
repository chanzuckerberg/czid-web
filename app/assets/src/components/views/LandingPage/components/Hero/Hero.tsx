import { Link } from "@czi-sds/components";
import React, { useEffect, useState } from "react";
import { HeroEmailForm } from "~/components/views/LandingPage/components/HeroEmailForm";
import HeroMobileBg from "~/images/landing_page/hero-mobile-bg.png";
import cs from "./Hero.scss";

export const Hero = () => {
  const [fade, setFade] = useState(false);
  const [moveUp, setMoveUp] = useState(false);
  const [longUnderline, setLongUnderline] = useState(false);

  useEffect(() => {
    const rotatingHeroText = ["Free", "Fast", "Accessible"];
    let i = 0;
    setInterval(function () {
      const textTarget = document.querySelector(".rotating-text");

      if (i === 2) {
        i = 0;
      } else {
        i++;
      }

      setFade(true);
      setMoveUp(false);

      setTimeout(function () {
        if (i === 2) {
          setLongUnderline(true);
        } else {
          setLongUnderline(false);
        }
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        textTarget.textContent = rotatingHeroText[i];
      }, 400);

      setTimeout(function () {
        setFade(false);
        setMoveUp(true);
      }, 700);
    }, 2500);
  }, []);

  return (
    <div className={cs.hero}>
      <h1>
        Metagenomic Analysis
        <br className={cs.heroLineBreak} /> made&nbsp;
        <span
          className={`rotating-text ${fade ? cs.fade : ""} ${
            moveUp ? cs.moveUp : ""
          } ${longUnderline ? cs.longUnderline : ""}`}
        >
          Free
        </span>
      </h1>
      <p className={cs.hero__copy}>
        The no-code, cloud-based bioinformatics tool for researchers
      </p>
      <div className={cs.hero__emailFormContainer}>
        <HeroEmailForm />
      </div>
      <div className={cs.finePrint}>
        {'By clicking "Register Now," you agree to our '}
        <Link href="/terms" sdsStyle="dashed">
          Terms
        </Link>
        {" and "}
        <Link href="/privacy" sdsStyle="dashed">
          Privacy Policy
        </Link>
        {"."}
      </div>
      <div className={cs.heroStatsContainer}>
        <div className={cs.heroStatsContainerItem}>
          <span>Countries</span>
          <p>112+</p>
        </div>
        <div className={cs.heroStatsContainerItem}>
          <span>Papers</span>
          <p>121+</p>
        </div>
        <div className={cs.heroStatsContainerItem}>
          <span>Samples</span>
          <p>320,000+</p>
        </div>
      </div>
      <img className={cs.hero__mobileBg} src={HeroMobileBg} alt="" />
    </div>
  );
};
