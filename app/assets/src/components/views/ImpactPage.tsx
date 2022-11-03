import React, { useState } from "react";
import ImpactBottomCTA from "~/components/views/impact_page/ImpactBottomCTA";
import { ImpactCountryData } from "~/components/views/impact_page/ImpactCountryData";
import ImpactCountryShowcase from "~/components/views/impact_page/ImpactCountryShowcase";
import ImpactHero from "~/components/views/impact_page/ImpactHero";
import ImpactIntro from "~/components/views/impact_page/ImpactIntro";
import ImpactVideoSection from "~/components/views/impact_page/ImpactVideoSection";
import Footer from "~/components/views/landing_page/Footer";
import Header from "~/components/views/landing_page/LandingHeaderV2";

// good Impact Page
const ImpactPage = () => {
  const [selectedCountry, setSelectedCountry] = useState(ImpactCountryData[0]);

  return (
    <>
      <Header impactPage={true} />
      <ImpactHero />
      <ImpactIntro
        setSelectedCountry={country => setSelectedCountry(country)}
        selectedCountry={selectedCountry}
      />
      <ImpactCountryShowcase
        setSelectedCountry={country => setSelectedCountry(country)}
        selectedCountry={selectedCountry}
      />
      <ImpactVideoSection />
      <ImpactBottomCTA />
      <Footer />
    </>
  );
};

export default ImpactPage;
