import React from "react";
import AccordionItem from "~/components/views/landing_page/AccordionItem";

export const KurtNobleAccordionItem = () => {
  return (
    <AccordionItem
      accordionTitle="How much data can I upload"
      accordionText="There is no limit on the amount of data that you can upload to IDseq."
      isOpen={false}
      onClick={() => null}
    />
  );
};

export default {
  title: "Kurt Noble Lander/Components",
  component: KurtNobleAccordionItem,
  argTypes: {},
};
