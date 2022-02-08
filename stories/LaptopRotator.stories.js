import React from "react";

import LaptopRotator from "~/components/views/landing_page/LaptopRotator";

export default {
  title: "Kurt Noble Lander/Components",
  component: KurtNobleLaptopRotator,
  parameters: {
    layout: "fullscreen",
  },
};

export const KurtNobleLaptopRotator = () => {
  return (
    <div>
      <LaptopRotator />
    </div>
  );
};
