import React from "react";
import { Footer } from "~/components/views/components/Footer";
import { LandingHeader as Header } from "~/components/views/components/LandingHeader";
import { Content } from "~/components/views/LandingPage/components/Content";
import { Hero } from "~/components/views/LandingPage/components/Hero";

interface LandingPageProps {
  announcementBannerEnabled?: boolean;
  emergencyBannerMessage?: string;
}

const LandingPage = ({
  announcementBannerEnabled,
  emergencyBannerMessage,
}: LandingPageProps) => {
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

export default LandingPage;
