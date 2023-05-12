import { Button, Tooltip } from "czifui";
import React from "react";
import cs from "./gene_cell.scss";

interface GeneCellProps {
  geneName: string;
  setDetailsSidebarGeneName: (geneName: string | null) => void;
}

export const GeneCell = ({
  geneName,
  setDetailsSidebarGeneName,
}: GeneCellProps) => {
  const handleGeneNameClick = () => {
    setDetailsSidebarGeneName(geneName);
  };

  return (
    <Tooltip title={geneName} sdsStyle="dark" arrow>
      <Button
        onClick={handleGeneNameClick}
        className={cs.geneNameButton}
        sdsType="secondary"
        sdsStyle="minimal"
        isAllCaps={false}
      >
        {geneName}
      </Button>
      {/* Once we're ready to add gene downloads, add that icon button inline right here */}
    </Tooltip>
  );
};
