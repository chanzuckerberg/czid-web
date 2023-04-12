import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import Section from "~/components/common/AnchorMenu/Section";
import Pathogens from "~/components/views/pathogen_list/Pathogens";
import { getSectionId } from "./SectionNavigation";
import cs from "./sections.scss";

interface SectionsProps {
  sectionContentByHeader: Record<string, any[]>;
  setCurrentSectionIndex: Dispatch<SetStateAction<number>>;
}

const Sections = ({
  sectionContentByHeader,
  setCurrentSectionIndex,
}: SectionsProps) => {
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);

  const setIndex = useCallback(
    entries => {
      const currentIntersections = entries.filter(
        entry => entry?.isIntersecting,
      );

      if (currentIntersections.length > 0) {
        // Use the section id to find the index in the ordered list of sections
        const orderedSections = Object.keys(sectionContentByHeader);
        const index = orderedSections.findIndex(
          section =>
            getSectionId(section) === currentIntersections[0]?.target?.id,
        );
        setCurrentSectionIndex(index);
      }
    },
    [setCurrentSectionIndex, sectionContentByHeader],
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
      {Object.keys(sectionContentByHeader).map(header => (
        <Section
          id={getSectionId(header)}
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

export default Sections;
