import PropTypes from "prop-types";
import React from "react";

import NavLink from "~/components/common/AnchorMenu/NavLink";
import cs from "./section_navigation.scss";

const getSectionId = section => {
  return section.replace(/\s+/g, "-").toLowerCase();
};

const SectionNavigation = ({
  currentSectionIndex,
  setCurrentSectionIndex,
  sectionContentByHeader,
}) => {
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

SectionNavigation.propTypes = {
  currentSectionIndex: PropTypes.number,
  setCurrentSectionIndex: PropTypes.func,
  sectionContentByHeader: PropTypes.object,
};

export default SectionNavigation;
