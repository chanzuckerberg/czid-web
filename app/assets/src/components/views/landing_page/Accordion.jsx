import React, { useEffect, useState } from "react";
import cs from "./Accordion.scss";
import AccordionItem from "./AccordionItem";

const Accordion = () => {
  const [openAccordion, setOpenAccordion] = useState(0);

  useEffect(() => {
    var accordions = document.querySelectorAll(".accordionItem");

    accordions.forEach(accordion => {
      var panel = accordion.children[2];
      panel.style.maxHeight = null;
    });

    accordions[openAccordion].children[2].style.maxHeight =
      accordions[openAccordion].children[2].scrollHeight + "px";
  }, [openAccordion]);

  function clickHandler(clickedAccordion) {
    setOpenAccordion(clickedAccordion);
  }

  return (
    <section className={cs.accordionContainer}>
      <AccordionItem
        onClick={() => {
          clickHandler(0);
        }}
        isOpen={openAccordion === 0}
        accordionTitle="How much data can I upload?"
        accordionText="There is no limit on the amount of data that you can upload to IDseq."
      />
      <AccordionItem
        onClick={() => {
          clickHandler(1);
        }}
        isOpen={openAccordion === 1}
        accordionTitle="Will IDseq remain free to use?"
        accordionText="Yes, IDseq is committed to remaining a free tool."
      />
      <AccordionItem
        onClick={() => {
          clickHandler(2);
        }}
        isOpen={openAccordion === 2}
        accordionTitle="Will my raw data ever become public?"
        accordionText={
          <>
            Raw sample data (genetic sequence files (ex: FASTA/FASTQ)) is not
            shared with any other IDseq user, nor is it ever accessed by anyone
            working on IDseq unless specifically requested by a user, such as to
            debug an issue. Read more in IDseq’s{" "}
            <a
              href="https://idseq.net/privacy"
              aria-label="View the IDseq privacy policy (opens in new window)"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
            .
          </>
        }
      />
      <AccordionItem
        onClick={() => {
          clickHandler(3);
        }}
        isOpen={openAccordion === 3}
        accordionTitle="How is human genomic data protected?"
        accordionText={
          <>
            Upon upload, raw sample data (genetic sequence files (ex:
            FASTA/FASTQ)) is processed through our data pipeline and all host
            (ex: human, mosquito) genetic information is filtered out. We always
            filter out all human genetic information, regardless of host. Read
            more in IDseq’s{" "}
            <a
              href="https://idseq.net/privacy"
              aria-label="View the IDseq privacy policy (opens in new window)"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
            .
          </>
        }
      />
      <AccordionItem
        onClick={() => {
          clickHandler(4);
        }}
        isOpen={openAccordion === 4}
        accordionTitle="Will my account last indefinitely?"
        accordionText={
          <>
            Once created, your account will be maintained in accordance with our{" "}
            <a
              href="https://idseq.net/terms"
              aria-label="View the IDseq terms of use (opens in new window)"
              target="_blank"
              rel="noreferrer"
            >
              Terms of Use
            </a>
            . You can request to delete your account at any time by{" "}
            <a href="mailto:help@idseq.net">contacting our team</a>.
          </>
        }
      />
    </section>
  );
};

export default Accordion;
