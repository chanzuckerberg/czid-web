import React from "react";
import HeroEmailForm from "~/components/views/landing_page/HeroEmailForm";
import cs from "./Hero.scss";
import "./transitions.css";

const Hero = () => {
  let rotatingHeroText = [
    "Real Time Pathogen Detection",
    "Real Time Microbiome Characterization",
    "Real Time Outbreak Detection",
  ];

  let i = 0;

  setInterval(function() {
    let textTarget = document.querySelector(".rotating-text");

    if (i === 2) {
      i = 0;
    } else {
      i++;
    }

    textTarget.classList.toggle("fade");

    setTimeout(function() {
      textTarget.textContent = rotatingHeroText[i];
    }, 500);

    setTimeout(function() {
      textTarget.classList.toggle("fade");
    }, 800);
  }, 5000);

  return (
    <div className={cs.hero}>
      <h1>
        <span className="rotating-text">Real-time Pathogen Detection</span>
      </h1>
      <p>IDseq: The Free, cloud-based metagenomics platform for researchers</p>
      <HeroEmailForm />
    </div>
  );
};

export default Hero;
