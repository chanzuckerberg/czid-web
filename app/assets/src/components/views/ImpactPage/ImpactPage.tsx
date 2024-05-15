import React, { useState } from "react";
import { Footer } from "~/components/views/components/Footer";
import { LandingHeader as Header } from "~/components/views/components/LandingHeader";
import ImpactBottomCTA from "~/components/views/ImpactPage/components/ImpactBottomCTA/ImpactBottomCTA";
import { ImpactCountryData } from "~/components/views/ImpactPage/components/ImpactCountryData";
import { ImpactCountryShowcase } from "~/components/views/ImpactPage/components/ImpactCountryShowcase";
import ImpactHero from "~/components/views/ImpactPage/components/ImpactHero/ImpactHero";
import { ImpactIntro } from "~/components/views/ImpactPage/components/ImpactIntro/ImpactIntro";
import { ImpactVideoSection } from "~/components/views/ImpactPage/components/ImpactVideoSection";

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
