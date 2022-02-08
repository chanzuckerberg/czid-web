import React from "react";

import QuoteSlider from "~/components/views/landing_page/QuoteSlider";

export default {
  title: "Kurt Noble Lander/Components",
  component: KurtNobleQuoteSlider,
  parameters: {
    layout: "fullscreen",
  },
};

export const KurtNobleQuoteSlider = () => {
  return (
    <div>
      <QuoteSlider />
    </div>
  );
};
