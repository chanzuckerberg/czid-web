import React, { useState } from "react";
import ImpactBottomCTA from "~/components/views/impact_page/ImpactBottomCTA";
import { ImpactCountryData } from "~/components/views/impact_page/ImpactCountryData";
import ImpactCountryShowcase from "~/components/views/impact_page/ImpactCountryShowcase";
import ImpactHero from "~/components/views/impact_page/ImpactHero";
import ImpactIntro from "~/components/views/impact_page/ImpactIntro";
import ImpactVideoSection from "~/components/views/impact_page/ImpactVideoSection";
import Footer from "~/components/views/landing_page/Footer";
import Header from "~/components/views/landing_page/LandingHeaderV2";
import ogImage from "~/images/impact_page/og-impact.png";

const metaTitle = "CZ ID Metagenomics Platform - Worldwide Research Projects";
const metaDescription =
  "Explore how Chan Zuckerberg ID is partnering with researchers to characterize pathogen landscapes and increase capacity for infectious disease research.";
const ogTitle =
  "Helping researchers detect and track emerging infectious diseases";
const ogDescription =
  "CZ ID helps researchers around the world detect and track infectious diseases";

if (document.querySelector('meta[name="title"]')) {
  document
    .querySelector('meta[name="title"]')
    .setAttribute("content", metaTitle);
} else {
  const metaTitle = document.createElement("meta");
  metaTitle.setAttribute("name", "title");
  metaTitle.setAttribute(
    "content",
    "CZ ID Metagenomics Platform - Worldwide Research Projects",
  );
  document.getElementsByTagName("head")[0].appendChild(metaTitle);
}
document
  .querySelector('meta[name="description"]')
  .setAttribute("content", metaDescription);
document
  .querySelector('meta[property="og:title"]')
  .setAttribute("content", ogTitle);
document
  .querySelector('meta[property="og:description"]')
  .setAttribute("content", ogDescription);
document
  .querySelector('meta[property="og:image"]')
  .setAttribute("content", ogImage);
document
  .querySelector('meta[property="og:image:width"]')
  .setAttribute("content", "1200");
document
  .querySelector('meta[property="og:image:height"]')
  .setAttribute("content", "630");

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
