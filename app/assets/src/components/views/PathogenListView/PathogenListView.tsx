import throttle from "lodash/throttle";
import React, { useMemo, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { NarrowContainer } from "~/components/layout";
import { AnchorMenu } from "./components/AnchorMenu";
import { SectionNavigation } from "./components/AnchorMenu/components/SectionNavigation";
import { PathogenCitations } from "./components/PathogenCitations";
import { PathogenIntro } from "./components/PathogenIntro";
import cs from "./pathogen_list_view.scss";
import { PathogenListViewQuery as PathogenListViewQueryType } from "./__generated__/PathogenListViewQuery.graphql";

export const PathogenListViewQuery = graphql`
  query PathogenListViewQuery {
    pathogenList {
      version
      citations
      updatedAt
      ...AnchorMenuFragment
      ...SectionNavigationFragment
    }
  }
`;

export const PathogenListView = () => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Pauses setCurrentSectionIndex while page-scroll in-progress
  const throttledSetCurrentIndex = useMemo(
    () =>
      throttle(index => {
        setCurrentSectionIndex(index);
      }, 600),
    [setCurrentSectionIndex],
  );

  const data = useLazyLoadQuery<PathogenListViewQueryType>(
    PathogenListViewQuery,
    {},
  );

  const pathogenData = data.pathogenList;

  return (
    <div className={cs.pathogenListViewContainer}>
      <NarrowContainer size="small">
        <div className={cs.title}>
          <h1>CZ ID Pathogen List</h1>
          <h4 className={cs.subtitle}>
            Last Updated: {pathogenData.updatedAt}. CZ ID Pathogen List v
            {pathogenData.version}.
          </h4>
        </div>
      </NarrowContainer>
      <div className={cs.content}>
        <div className={cs.marginLeft} />
        <NarrowContainer size="small">
          {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531 */}
          <PathogenIntro numOfCitations={pathogenData.citations.length} />
          <AnchorMenu
            pathogenData={pathogenData}
            setCurrentSectionIndex={throttledSetCurrentIndex}
          />
          {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322 */}
          <PathogenCitations citations={pathogenData.citations} />
        </NarrowContainer>
        <div className={cs.marginRight}>
          <div className={cs.anchorMenu}>
            <SectionNavigation
              pathogenData={pathogenData}
              currentSectionIndex={currentSectionIndex}
              setCurrentSectionIndex={setCurrentSectionIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
