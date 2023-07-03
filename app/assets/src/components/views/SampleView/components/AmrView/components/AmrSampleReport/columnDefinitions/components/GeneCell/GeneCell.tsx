import { Button, ButtonIcon, DropdownMenu, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import React, { useContext, useState } from "react";
import { UserContext } from "~/components/common/UserContext";
import { AMR_V3_FEATURE } from "~/components/utils/features";
import { isAmrGeneLevelDownloadAvailable } from "~/components/utils/pipeline_versions";
import {
  geneLevelDownloadOptions,
  RenderedGeneLevelDownloadOption,
} from "./components/RenderedGeneLevelDownloadOption";
import cs from "./gene_cell.scss";

interface GeneCellProps {
  contigs: string | null;
  geneName: string;
  setDetailsSidebarGeneName: (geneName: string | null) => void;
  geneId: string;
  reads: string | null;
  workflowRunId: number;
  workflowWdlVersion: string;
}

export const GeneCell = ({
  contigs,
  geneName,
  setDetailsSidebarGeneName,
  geneId,
  reads,
  workflowRunId,
  workflowWdlVersion,
}: GeneCellProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const handleGeneNameClick = () => {
    setDetailsSidebarGeneName(geneName);
  };

  const handleAnchorClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isOpen) {
      setIsOpen(false);
      if (anchorEl) {
        anchorEl.focus();
      }
    } else {
      setAnchorEl(event.currentTarget);
      setIsOpen(true);
    }
  };

  const handleClickAway = () => {
    // Close the DropdownMenu
    setIsOpen(false);
  };

  const handleKeyEscape = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      // Close the DropdownMenu and return focus to the anchor element
      setIsOpen(false);
      if (anchorEl) {
        anchorEl.focus();
      }
    }
  };

  // This render function is not defined inline for performance reasons.
  // The DropdownMenu prop "renderOption" takes a function in this format and not a React component.
  // Leaving the lambda function inline can cause hundreds of instances of the same function to be created
  // because there can be hundreds of dropdown options on an AmrSampleReport.
  const renderDownloadOption = (_, option) => {
    return (
      <RenderedGeneLevelDownloadOption
        contigs={contigs}
        geneId={geneId}
        geneName={geneName}
        option={option}
        reads={reads}
        workflowRunId={workflowRunId}
      />
    );
  };

  return (
    <span className={cs.geneCell}>
      <Tooltip title={geneName} sdsStyle="dark" arrow>
        <span>
          <Button
            onClick={handleGeneNameClick}
            className={cs.geneNameButton}
            sdsType="secondary"
            sdsStyle="minimal"
            isAllCaps={false}
          >
            {geneName}
          </Button>
        </span>
      </Tooltip>
      {allowedFeatures.includes(AMR_V3_FEATURE) && (
        <>
          <Tooltip
            title={
              isAmrGeneLevelDownloadAvailable(workflowWdlVersion)
                ? ""
                : "Downloads are not available for pipeline runs before v1.1"
            }
            placement="top"
            sdsStyle="light"
          >
            <span>
              <ButtonIcon
                disabled={!isAmrGeneLevelDownloadAvailable(workflowWdlVersion)}
                onClick={handleAnchorClick}
                className={cx(cs.downloadIcon, isOpen && cs.showHoverActions)}
                sdsSize="small"
                sdsType="primary"
                sdsIcon={"download"}
              />
            </span>
          </Tooltip>
          <DropdownMenu
            className={cs.hoverAction}
            open={isOpen}
            anchorEl={anchorEl}
            onClickAway={handleClickAway}
            onKeyDown={handleKeyEscape}
            options={geneLevelDownloadOptions}
            renderOption={renderDownloadOption}
          />
        </>
      )}
    </span>
  );
};
