import React from "react";

import HeroEmailForm from "~/components/views/landing_page/HeroEmailForm";

export default {
  title: "Kurt Noble Lander/Components",
  component: KurtNobleHeroEmailForm,
  parameters: {
    layout: "fullscreen",
  },
};

export const KurtNobleHeroEmailForm = () => {
  return (
    <div>
      <HeroEmailForm />
    </div>
  );
};
