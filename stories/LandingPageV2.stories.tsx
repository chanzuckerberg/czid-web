import React from "react";

import LandingV2 from "~/components/views/LandingV2";

export const LandingPageDemo = () => {
  return <LandingV2 />;
};

export default {
  title: "Pages",
  component: LandingPageDemo,
  parameters: {
    layout: "fullscreen",
  },
};
