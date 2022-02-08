import React from "react";

import TabbedGallery from "~/components/views/landing_page/TabbedGallery";

export default {
  title: "Kurt Noble Lander/Components",
  component: KurtNobleTabbedGallery,
  argTypes: {},
};

export const KurtNobleTabbedGallery = () => {
  return (
    <div>
      <TabbedGallery />
    </div>
  );
};
