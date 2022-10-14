import React from "react";
import ImpactBottomCTA from "~/components/views/impact_page/ImpactBottomCTA";
import ImpactCountryShowcase from "~/components/views/impact_page/ImpactCountryShowcase";
import ImpactHero from "~/components/views/impact_page/ImpactHero";
import ImpactIntro from "~/components/views/impact_page/ImpactIntro";
import ImpactVideoSection from "~/components/views/impact_page/ImpactVideoSection";
import Footer from "~/components/views/landing_page/Footer";
import Header from "~/components/views/landing_page/LandingHeaderV2";

// good Impact Page
const ImpactPage = () => {
  return (
    <>
      <Header impactPage={true} />
      <ImpactHero />
      <ImpactIntro />
      <ImpactCountryShowcase />
      <ImpactVideoSection />
      <ImpactBottomCTA />
      <Footer />
    </>
  );
};

export default ImpactPage;
