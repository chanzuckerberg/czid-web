import React from "react";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import cs from "../../pathogen_list_view.scss";

interface PathogenIntroProps {
  numOfCitations: number;
}

export const PathogenIntro = ({ numOfCitations }: PathogenIntroProps) => {
  return (
    <div className={cs.intro}>
      <p>
        This list includes pathogens with known pathogenicity in immunocompetent
        human hosts as well as a few common causes of disease in
        immunocompromised human hosts{" "}
        <a href={window.location.pathname + "#citations"}>
          [1-{numOfCitations}]
        </a>
        . It serves to highlight organisms with known pathogenicity in humans,
        but may not be fully comprehensive. Thus, researchers should reference
        the literature for rare causes of disease. Additionally, some of these
        organisms are known pathobionts - commensals within particular body
        sites (ie Candida aureus may be found in the lung without causing an
        infection), and should be interpreted with respect to the literature.
      </p>
      <p>
        Reach out to{" "}
        <a href={CONTACT_US_LINK} target="_blank" rel="noopener noreferrer">
          our Help Center
        </a>{" "}
        to help us make the list better, or if there is any questions or
        comments. We are excited to hear from you!
      </p>
    </div>
  );
};
