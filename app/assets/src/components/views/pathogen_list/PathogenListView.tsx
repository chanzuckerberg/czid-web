import { groupBy, sortBy } from "lodash/fp";
import throttle from "lodash/throttle";
import React, { useState, useEffect, useMemo } from "react";

import { getPathogenList } from "~/api/pathogen_lists";
import SectionNavigation from "~/components/common/AnchorMenu/SectionNavigation";
import Sections from "~/components/common/AnchorMenu/Sections";
import { NarrowContainer } from "~/components/layout";
import List from "~/components/ui/List";

import cs from "./pathogen_list_view.scss";

const PathogenListView = () => {
  const [pathogenList, setPathogenList] = useState(null);
  const [categorizedPathogens, setCategorizedPathogens] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Pauses setCurrentSectionIndex while page-scroll in-progress
  const throttledSetCurrentIndex = useMemo(
    () =>
      throttle(index => {
        setCurrentSectionIndex(index);
      }, 600),
    [setCurrentSectionIndex],
  );

  useEffect(() => {
    const fetchPathogenList = async () => {
      const result = await getPathogenList();
      const alphabetizedPathogens = sortBy("name", result["pathogens"]);
      const categorizedPathogens = groupBy("category", alphabetizedPathogens);

      setPathogenList(result);
      setCategorizedPathogens(categorizedPathogens);
    };
    fetchPathogenList();
  }, []);

  const renderTitle = () => (
    <div className={cs.title}>
      <h1>CZ ID Pathogen List</h1>
      <h4 className={cs.subtitle}>
        Last Updated: {pathogenList["updated_at"]}. CZ ID Pathogen List v
        {pathogenList["version"]}.
      </h4>
    </div>
  );

  const renderIntro = () => (
    <>
      <div className={cs.intro}>
        <p>
          This list includes pathogens with known pathogenicity in
          immunocompetent human hosts as well as a few common causes of disease
          in immunocompromised human hosts{" "}
          <a href={window.location.pathname + "#citations"}>
            [1-{pathogenList["citations"].length}]
          </a>
          . It serves to highlight organisms with known pathogenicity in humans,
          but may not be fully comprehensive. Thus, researchers should reference
          the literature for rare causes of disease. Additionally, some of these
          organisms are known pathobionts - commensals within particular body
          sites (ie Candida aureus may be found in the lung without causing an
          infection), and should be interpreted with respect to the literature.
        </p>
        <p>
          Reach out to <a href="mailto:help@czid.org">help@czid.org</a> to help
          us make the list better, or if there is any questions or comments. We
          are excited to hear from you!
        </p>
      </div>
    </>
  );

  const renderPathogenList = () => (
    <Sections
      sectionContentByHeader={categorizedPathogens}
      setCurrentSectionIndex={throttledSetCurrentIndex}
    />
  );

  const renderCitations = () => (
    <div className={cs.citations} id={"citations"}>
      <h3>Citations</h3>
      <List
        listClassName={cs.list}
        listItems={pathogenList["citations"].sort()}
        ordered={true}
      ></List>
    </div>
  );

  if (!pathogenList) return null;

  return (
    <div className={cs.pathogenListViewContainer}>
      <NarrowContainer size="small">{renderTitle()}</NarrowContainer>
      <div className={cs.content}>
        <div className={cs.marginLeft} />
        <NarrowContainer size="small">
          {renderIntro()}
          {renderPathogenList()}
          {renderCitations()}
        </NarrowContainer>
        <div className={cs.marginRight}>
          <div className={cs.anchorMenu}>
            <SectionNavigation
              currentSectionIndex={currentSectionIndex}
              setCurrentSectionIndex={setCurrentSectionIndex}
              sectionContentByHeader={categorizedPathogens}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathogenListView;
