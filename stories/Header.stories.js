import React from "react";

import Header from "~/components/views/landing_page/LandingHeaderV2";

export default {
  title: "Kurt Noble Lander/Sections",
  component: KurtNobleHeader,
  parameters: {
      layout: "fullscreen",
  },
};

export const KurtNobleHeader = () => {
    return (
        <div>
            <Header />
        </div>
    )
}