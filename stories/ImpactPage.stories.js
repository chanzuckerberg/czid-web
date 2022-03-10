import React from "react";

import ImpactPage from "~/components/views/impact_page/ImpactPage";

export default {
  title: "Pages",
  component: ImpactPageDemo,
  parameters: {
    layout: "fullscreen",
  },
};

export const ImpactPageDemo = () => {
  return <ImpactPage />;
};
