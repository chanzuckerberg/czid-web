import PropTypes from "prop-types";
import React from "react";

import Content from "~/components/views/landing_page/Content";
import Footer from "~/components/views/landing_page/Footer";
import Hero from "~/components/views/landing_page/Hero";
import Header from "~/components/views/landing_page/LandingHeaderV2";

const LandingV2 = ({ announcementBannerEnabled, emergencyBannerMessage }) => {
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

LandingV2.propTypes = {
  announcementBannerEnabled: PropTypes.bool,
  emergencyBannerMessage: PropTypes.string,
};

export default LandingV2;
