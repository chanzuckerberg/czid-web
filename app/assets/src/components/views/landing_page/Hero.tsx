import React, { useState, useEffect } from "react";
import HeroEmailForm from "~/components/views/landing_page/HeroEmailForm";
import cs from "./Hero.scss";

interface HeroProps {
  autoAcctCreationEnabled?: boolean;
}

const Hero = ({ autoAcctCreationEnabled }: HeroProps) => {
  const [fade, setFade] = useState(false);
  const [moveUp, setMoveUp] = useState(false);
  const [shiftLeft, setShiftLeft] = useState(false);

  const rotatingHeroText = [
    "Pathogen Detection",
    "Microbiome Characterization",
    "Outbreak Detection",
  ];

  let i = 0;

  useEffect(() => {
    setInterval(function() {
      const textTarget = document.querySelector(".rotating-text");

      if (i === 2) {
        i = 0;
      } else {
        i++;
      }

      setFade(true);
      setMoveUp(false);

      setTimeout(function() {
        if (i === 1) {
          setShiftLeft(true);
        } else {
          setShiftLeft(false);
        }
        textTarget.textContent = rotatingHeroText[i];
      }, 500);

      setTimeout(function() {
        setFade(false);
        setMoveUp(true);
      }, 800);
    }, 5000);
  }, []);

  return (
    <div className={cs.hero}>
      <h1 className={shiftLeft ? cs.shiftLeft : ""}>
        Real-time&nbsp;
        <br className={cs.heroLineBreak} />
        <span
          className={`rotating-text ${fade ? cs.fade : ""} ${
            moveUp ? cs.moveUp : ""
          }`}
        >
          Pathogen Detection
        </span>
      </h1>
      <p>
        Chan Zuckerberg ID: The free, cloud-based metagenomics platform for
        researchers
      </p>
      <HeroEmailForm autoAcctCreationEnabled={autoAcctCreationEnabled} />
    </div>
  );
};

export default Hero;
