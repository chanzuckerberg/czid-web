import React, { useState, useEffect } from "react";

import { getPathogenList } from "~/api/pathogen_lists";
import { NarrowContainer } from "~/components/layout";

import cs from "./pathogen_list_view.scss";

const PathogenListView = () => {
  const [pathogenList, setPathogenList] = useState(null);

  useEffect(async () => {
    const result = await getPathogenList();

    setPathogenList(result);
  }, []);

  const renderIntro = () => (
    <>
      <div className={cs.title}>
        <h1>IDseq Pathogen List</h1>
        <h4 className={cs.subtitle}>
          Last Updated: {pathogenList["updated_at"]}. IDseq Pathogen List v
          {pathogenList["version"]}.
        </h4>
      </div>
      <div className={cs.intro}>
        <p>
          This list includes pathogens with known pathogenicity in
          immunocompetent human hosts as well as a few common causes of disease
          in immunocompromised human hosts. It serves to highlight organisms
          with known pathogenicity in humans, but may not be fully
          comprehensive. Thus, researchers should reference the literature for
          rare causes of disease. Additionally, some of these organisms are
          known pathobionts - commensals within particular body sites (ie
          Candida aureus may be found in the lung without causing an infection),
          and should be interpreted with respect to the literature.
        </p>
        <p>
          Reach out to <a href="mailto:help@idseq.net">help@idseq.net</a> to
          help us make the list better, or if there is any questions or
          comments. We are excited to hear from you!
        </p>
      </div>
    </>
  );

  if (!pathogenList) return null;

  return (
    <NarrowContainer className={cs.pathogenListView} size="small">
      {renderIntro()}
    </NarrowContainer>
  );
};

export default PathogenListView;
