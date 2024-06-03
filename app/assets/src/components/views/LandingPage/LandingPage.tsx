import React from "react";
import { Footer } from "~/components/common/Footer";
import { LandingHeader as Header } from "~/components/common/LandingHeader";
import { Content } from "~/components/views/LandingPage/components/Content";
import { Hero } from "~/components/views/LandingPage/components/Hero";

interface LandingPageProps {
  announcementBannerEnabled?: boolean;
  emergencyBannerMessage?: string;
}

export const LandingPage = ({
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
