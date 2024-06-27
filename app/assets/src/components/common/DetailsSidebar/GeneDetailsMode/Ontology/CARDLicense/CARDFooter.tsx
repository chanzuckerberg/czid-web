import React from "react";
import { OntologyType } from "../../GeneDetailsMode";
import cs from "../../gene_details_mode.scss";
import { generateLinkTo, Sources } from "../../utils";

interface CARDFooterProps {
  geneName: string;
  ontology: OntologyType;
}

const CARDFooter = ({ geneName, ontology }: CARDFooterProps) => {
  return (
    <div className={cs.cardFooter}>
      <div>
        This article uses material from the{" "}
        <a
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          href={generateLinkTo({
            geneName,
            ontology,
            source: Sources.OWL,
          })}
          className={cs.cardLink}
          target="_blank"
          rel="noopener noreferrer"
          // this is broken, but alldoami found it while working on something unrelated
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onClick={() => {}}
        >
          CARD Antibiotic Resistance Ontology
        </a>
        , which is released under the{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className={cs.cardLink}
          target="_blank"
          rel="noopener noreferrer"
          // this is broken, but alldoami found it while working on something unrelated
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onClick={() => {}}
        >
          Creative Commons CC-BY license version 4.0
        </a>{" "}
        by McMaster University.
      </div>
      <div className={cs.disclaimer}>
        Disclaimer: This uses the most recent CARD database, it may differ from
        your AMR results.
      </div>
    </div>
  );
};

export default CARDFooter;
