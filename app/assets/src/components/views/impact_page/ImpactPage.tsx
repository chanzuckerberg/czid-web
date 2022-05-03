import React from "react";
import Footer from "../landing_page/Footer";
import LandingHeaderV2 from "../landing_page/LandingHeaderV2";
import ImpactBottomCTA from "./ImpactBottomCTA";
import ImpactCountryGrid from "./ImpactCountryGrid";
import ImpactHero from "./ImpactHero";
import ImpactIntro from "./ImpactIntro";
import ImpactVideoSection from "./ImpactVideoSection";

const ImpactPage = () => {
  return (
    <>
      <LandingHeaderV2 impactPage={true} />
      <ImpactHero />
      <ImpactIntro />
      <ImpactCountryGrid />
      <ImpactVideoSection />
      <ImpactBottomCTA />
      <Footer />
    </>
  );
};

export default ImpactPage;
