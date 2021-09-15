import React from "react";

import Lander from "~/components/views/landing_page/Lander";

export default {
  title: "Pages",
  component: KurtNobleLandingPage,
  argTypes: {},
};

export const KurtNobleLandingPage = () => {
    return (
        <div>
            <Lander />
        </div>
    )
}