import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { graphql, useFragment } from "react-relay";
import { categorizeItems } from "../../utils";
import { Pathogens } from "../Pathogens";
import cs from "./anchor_menu.scss";
import { Section } from "./components/Section";
import { getSectionId } from "./components/SectionNavigation";
import {
  AnchorMenuFragment$data,
  AnchorMenuFragment$key,
} from "./__generated__/AnchorMenuFragment.graphql";
interface AnchorMenuProps {
  setCurrentSectionIndex: Dispatch<SetStateAction<number>>;
  pathogenData: AnchorMenuFragment$key;
}

export const AnchorMenuFragment = graphql`
  fragment AnchorMenuFragment on PathogenList {
    pathogens {
      category
      name
      taxId
    }
  }
`;

interface Entry {
  isIntersecting: boolean;
  target?: { id: string };
}

export const AnchorMenu = ({
  pathogenData,
  setCurrentSectionIndex,
}: AnchorMenuProps) => {
  const data = useFragment(AnchorMenuFragment, pathogenData);
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);
  const sectionContentByHeader = useMemo(
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2344
    () => categorizeItems<AnchorMenuFragment$data["pathogens"]>(data.pathogens),
    [data.pathogens],
  );
  const setIndex = useCallback(
    (entries: Entry[]) => {
      const currentIntersections = entries.filter(
        entry => entry?.isIntersecting,
      );

      if (currentIntersections.length > 0) {
        // Use the section id to find the index in the ordered list of sections
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
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
      {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769 */}
      {Object.keys(sectionContentByHeader).map(header => (
        <Section
          id={getSectionId(header)}
          key={`section-${getSectionId(header)}`}
          name={header}
          observer={observer}
        >
          {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531 */}
          <Pathogens pathogensByHeader={sectionContentByHeader[header]} />
        </Section>
      ))}
    </div>
  );
};
