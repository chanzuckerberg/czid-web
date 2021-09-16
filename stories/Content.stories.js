import React from "react";

import Content from "~/components/views/landing_page/Content";

export default {
  title: "Kurt Noble Lander/Sections",
  component: KurtNobleContent,
  parameters: {
    layout: "fullscreen",
  },
};

export const KurtNobleContent = () => {
    return (
        <div>
            <Content />
        </div>
    )
}