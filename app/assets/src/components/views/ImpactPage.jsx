import PropTypes from "prop-types";
import React from "react";
import ImpactBottomCTA from "~/components/views/impact_page/ImpactBottomCTA";
import ImpactCountryGrid from "~/components/views/impact_page/ImpactCountryGrid";
import ImpactHero from "~/components/views/impact_page/ImpactHero";
import ImpactIntro from "~/components/views/impact_page/ImpactIntro";
import ImpactVideoSection from "~/components/views/impact_page/ImpactVideoSection";
import Footer from "~/components/views/landing_page/Footer";
import Header from "~/components/views/landing_page/LandingHeaderV2";

const ImpactPage = () => {
  return (
    <>
      <Header impactPage={true} />
      <ImpactHero />
      <ImpactIntro />
      <ImpactCountryGrid />
      <ImpactVideoSection />
      <ImpactBottomCTA />
      <Footer />
    </>
  );
};

ImpactPage.propTypes = {
  impactPage: PropTypes.bool,
};

export default ImpactPage;
