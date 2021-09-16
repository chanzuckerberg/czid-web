import React from "react";

import Hero from "~/components/views/landing_page/Hero";

export default {
  title: "Kurt Noble Lander/Sections",
  component: KurtNobleHero,
  parameters: {
    layout: "fullscreen",
},
};

export const KurtNobleHero = () => {
    return (
        <div>
            <Hero />
        </div>
    )
}