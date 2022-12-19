import React from "react";

import Lander from "~/components/views/landing_page/Lander";

export const KurtNobleLandingPage = () => {
  return (
    <div>
      <Lander />
    </div>
  );
};

export default {
  title: "Pages",
  component: KurtNobleLandingPage,
  parameters: {
    layout: "fullscreen",
  },
};
