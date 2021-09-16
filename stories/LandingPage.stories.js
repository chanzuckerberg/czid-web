import React from "react";

import Lander from "~/components/views/landing_page/Lander";

export default {
  title: "Pages",
  component: KurtNobleLandingPage,
  parameters: {
    layout: "fullscreen",
},
};

export const KurtNobleLandingPage = () => {
    return (
        <div>
            <Lander />
        </div>
    )
}