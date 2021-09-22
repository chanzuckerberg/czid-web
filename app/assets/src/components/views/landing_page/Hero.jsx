import React, {useState, useEffect} from "react";
import HeroEmailForm from "~/components/views/landing_page/HeroEmailForm";
import cs from "./Hero.scss";

const Hero = () => {

  const [fade, setFade] = useState(false);

  let rotatingHeroText = [
    "Real Time Pathogen Detection",
    "Real Time Microbiome Characterization",
    "Real Time Outbreak Detection",
  ];

  let i = 0;

  useEffect(()=>{
    setInterval(function() {
      let textTarget = document.querySelector(".rotating-text");
  
      if (i === 2) {
        i = 0;
      } else {
        i++;
      }
  
      setFade(true);
  
      setTimeout(function() {
        textTarget.textContent = rotatingHeroText[i];
      }, 500);
  
      setTimeout(function() {
        setFade(false);
      }, 800);
    }, 5000);
  }, []);

  return (
    <div className={cs.hero}>
      <h1>
        <span 
          className={`rotating-text ${fade ? cs.fade : ""}`}
          // style={fade ? cs.fade : ""}
          >Real-time Pathogen Detection</span>
      </h1>
      <p>IDseq: The Free, cloud-based metagenomics platform for researchers</p>
      <HeroEmailForm />
    </div>
  );
};

export default Hero;
