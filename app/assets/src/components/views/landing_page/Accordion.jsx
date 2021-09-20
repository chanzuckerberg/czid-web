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
        accordionText="Yes, IDseq is committed to remaining a free tool."
      />
      <AccordionItem
        accordionTitle="Will my raw data ever become public?"
        accordionText={
          <>
            Raw sample data (genetic sequence files (ex: FASTA/FASTQ)) is not shared with any other IDseq user, nor is it ever accessed by anyone working on IDseq unless specifically requested by a user, such as to debug an issue. Read more in IDseq’s <a href="https://idseq.net/privacy">Privacy Policy</a>.
          </>
        }
      />
      <AccordionItem
        accordionTitle="How is human genomic data protected?"
        accordionText={
          <>
            Upon upload, raw sample data (genetic sequence files (ex: FASTA/FASTQ)) is processed through our data pipeline and all host (ex: human, mosquito) genetic information is filtered out. We always filter out all human genetic information, regardless of host. Read more in IDseq’s <a href="https://idseq.net/privacy">Privacy Policy</a>.
          </>
        }
      />
      <AccordionItem
        accordionTitle="Will my account last indefinitely?"
        accordionText={
          <>
            Once created, your account will be maintained in accordance with our <a href="https://idseq.net/terms">Terms of Use</a>. You can request to delete your account at any time by <a href="mailto:help@idseq.net">contacting our team</a>.
          </>
        }
      />
    </section>
  );
};

export default Accordion;
