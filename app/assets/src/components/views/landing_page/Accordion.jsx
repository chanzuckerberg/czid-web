import React from "react";
import cs from "./Accordion.scss";
import AccordionItem from "./AccordionItem";

const Accordion = () => {
  return (
    <section className={cs.accordionContainer}>
      <AccordionItem
        accordionTitle="How much data can I upload"
        accordionText="There is no limit on the amount of data that you can upload to IDseq."
      />
      <AccordionItem
        accordionTitle="Will IDseq remain free to use?"
        accordionText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio quas libero mollitia placeat hic, illum molestiae iure quis architecto ducimus?"
      />
      <AccordionItem
        accordionTitle="Will my raw data ever become public?"
        accordionText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio quas libero mollitia placeat hic, illum molestiae iure quis architecto ducimus?"
      />
      <AccordionItem
        accordionTitle="How is human genomic data protected?"
        accordionText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio quas libero mollitia placeat hic, illum molestiae iure quis architecto ducimus?"
      />
      <AccordionItem
        accordionTitle="Will my account last indefinitely?"
        accordionText="Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio quas libero mollitia placeat hic, illum molestiae iure quis architecto ducimus?"
      />
    </section>
  );
};

export default Accordion;
