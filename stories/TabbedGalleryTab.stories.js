import React, { useState } from "react";

import TabbedGalleryTab from "~/components/views/landing_page/TabbedGalleryTab";

export default {
  title: "Kurt Noble Lander/Components",
  component: KurtNobleTabbedGalleryTab,
  argTypes: {},
};

export const KurtNobleTabbedGalleryTab = () => {
  const [activeTab, setActiveTab] = useState(null);

  return (
    <div>
      <TabbedGalleryTab
        tabTitle="Push button pipelines & results"
        tabDescription="Discover potentially infectious organisms with an easy-to-use GUI&#8212;no coding required."
        activeClass={activeTab === 0 ? "active" : ""}
        onClick={() => {
          setActiveTab(0);
        }}
      />
    </div>
  );
};
