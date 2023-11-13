import React from "react";
import Content from "~/components/views/landing_page/Content";
import Footer from "~/components/views/landing_page/Footer";
import Hero from "~/components/views/landing_page/Hero";
import Header from "~/components/views/landing_page/LandingHeaderV2";

interface LandingV2Props {
  announcementBannerEnabled?: boolean;
  emergencyBannerMessage?: string;
}

const LandingV2 = ({
  announcementBannerEnabled,
  emergencyBannerMessage,
}: LandingV2Props) => {
  return (
    <div>
      <Header
        announcementBannerEnabled={announcementBannerEnabled}
        emergencyBannerMessage={emergencyBannerMessage}
      />
      <Hero />
      <Content />
      <Footer />
    </div>
  );
};

export default LandingV2;
