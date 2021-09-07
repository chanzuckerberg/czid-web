import React from "react";

import Landing from "~/components/views/Landing";

export default {
  title: "Pages",
  component: LandingPageDemo,
  argTypes: {},
};

export const LandingPageDemo = () => {
  console.log(navigator);
  return (
    <div>
      <Landing
        browserInfo={{ browser: navigator.userAgent, supported: true }}
        contactEmail="accounts@idseq.net"
        showBulletin
        showAnnouncementBanner={false}
        showPublicSite
      />
    </div>
  );
};
