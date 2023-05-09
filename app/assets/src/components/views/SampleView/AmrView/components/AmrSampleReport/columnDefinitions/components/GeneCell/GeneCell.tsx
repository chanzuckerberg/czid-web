import { Tooltip } from "czifui";
import React, { useState } from "react";
import cs from "./gene_cell.scss";

interface GeneCellProps {
  geneName: string;
  setDetailsSidebarGeneName: (geneName: string | null) => void;
}

export const GeneCell = ({
  geneName,
  setDetailsSidebarGeneName,
}: GeneCellProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleGeneNameClick = () => {
    setDetailsSidebarGeneName(geneName);
  };

  return (
    <Tooltip title={geneName} sdsStyle="dark" arrow>
      <div
        className={cs.geneCellWrapper}
        onMouseEnter={() => handleMouseEnter()}
        onMouseLeave={() => handleMouseLeave()}
      >
        <div className={isHovered ? cs.hoveredGeneName : null}>
          <span
            role="button"
            tabIndex={0}
            onClick={() => handleGeneNameClick()}
            onKeyDown={() => handleGeneNameClick()}
          >
            {geneName}
          </span>

          {/* Once we're ready to add gene downloads, add that icon button inline right here */}
        </div>
      </div>
    </Tooltip>
  );
};
