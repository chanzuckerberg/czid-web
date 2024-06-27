import React, { useMemo } from "react";
import { graphql, useFragment } from "react-relay";
import { categorizeItems } from "~/components/views/PathogenListView/utils";
import { NavLink } from "./components/NavLink";
import cs from "./section_navigation.scss";
import type { SectionNavigationFragment$key } from "./__generated__/SectionNavigationFragment.graphql";

export const getSectionId = (section: string) => {
  return section.replace(/\s+/g, "-").toLowerCase();
};

export const SectionNavigationFragment = graphql`
  fragment SectionNavigationFragment on PathogenList {
    pathogens {
      category
      name
    }
  }
`;

interface SectionNavigationProps {
  pathogenData: SectionNavigationFragment$key;
  currentSectionIndex: number;
  setCurrentSectionIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const SectionNavigation = ({
  currentSectionIndex,
  setCurrentSectionIndex,
  pathogenData,
}: SectionNavigationProps) => {
  const data = useFragment(SectionNavigationFragment, pathogenData);
  const sectionContentByHeader = useMemo(
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    () => categorizeItems(data.pathogens),
    [data.pathogens],
  );
  return (
    <ul className={cs.navWrapper}>
      <h2 className={cs.navTitle}>Jump to Section:</h2>
      <div className={cs.navLinksContainer}>
        {Object.keys(sectionContentByHeader)?.map((header, index) => {
          return (
            <NavLink
              id={`#${getSectionId(header)}`}
              isCurrent={currentSectionIndex === index}
              key={`navlink-${getSectionId(header)}`}
              name={`${header} (${sectionContentByHeader[header].length})`}
              onClick={() => setCurrentSectionIndex(index)}
            />
          );
        })}
      </div>
    </ul>
  );
};
