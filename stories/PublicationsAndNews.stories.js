import React from "react";
import {
  Publications,
  News,
} from "~/components/views/landing_page/PublicationsAndNews";

const PublicationsAndNews = () => {
  return (
    <>
      <Publications />
      <News />
    </>
  );
};

export default {
  title: "Kurt Noble Lander/Sections",
  component: PublicationsAndNews,
  argTypes: {},
};

export const PublicationsAndNewsStory = () => {
  return <PublicationsAndNews />;
};
