import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";

import Section from "~/components/common/AnchorMenu/Section";
import Pathogens from "../../views/pathogen_list/Pathogens";

import cs from "./sections.scss";

const getSectionId = section => {
  return section.replace(/\s+/g, "-").toLowerCase();
};

const Sections = ({ sectionContentByHeader, setCurrentSectionIndex }) => {
  const [observer, setObserver] = useState();

  const setIndex = useCallback(
    entries => {
      const currentIntersections = entries.filter(
        entry => entry?.isIntersecting
      );

      if (currentIntersections.length > 0) {
        // Use the section id to find the index in the ordered list of sections
        const orderedSections = Object.keys(sectionContentByHeader);
        const index = orderedSections.findIndex(
          section =>
            getSectionId(section) === currentIntersections[0]?.target?.id
        );
        setCurrentSectionIndex(index);
      }
    },
    [setCurrentSectionIndex, sectionContentByHeader]
  );

  // TODO: add comment clarifying rootMargin percentages
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "-20% 0% -65% 0%",
    };

    const observerInstance = new IntersectionObserver(setIndex, options);
    setObserver(observerInstance);
  }, [setIndex]);

  return (
    <div className={cs.sections}>
      {Object.keys(sectionContentByHeader).map((header, key) => (
        <Section
          id={getSectionId(header)}
          index={key}
          key={`section-${getSectionId(header)}`}
          name={header}
          observer={observer}
        >
          <Pathogens pathogens={sectionContentByHeader[header]} />
        </Section>
      ))}
    </div>
  );
};

Sections.propTypes = {
  sectionContentByHeader: PropTypes.object,
  setCurrentSectionIndex: PropTypes.func,
};

export default Sections;
