import { Button, ButtonIcon, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import { BareDropdown } from "~/components/ui/controls/dropdowns";
import { AMR_V3_FEATURE } from "~/components/utils/features";
import {
  DOWNLOAD_CONTIGS,
  DOWNLOAD_READS,
} from "~/components/views/SampleView/constants";
import { downloadAmrGeneLevelData } from "~/components/views/SampleView/SampleViewHeader/PrimaryHeaderControls/AmrDownloadDropdown/amrDownloadUtils";
import cs from "./gene_cell.scss";

interface GeneCellProps {
  geneName: string;
  setDetailsSidebarGeneName: (geneName: string | null) => void;
  geneId: string;
  workflowRunId: number;
}

export const GeneCell = ({
  geneName,
  setDetailsSidebarGeneName,
  geneId,
  workflowRunId,
}: GeneCellProps) => {
  const [showHoverActions, setShowHoverActions] = React.useState(false);
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const handleGeneNameClick = () => {
    setDetailsSidebarGeneName(geneName);
  };

  const downloadOptions = [
    {
      text: "Contigs (.fasta)",
      value: DOWNLOAD_CONTIGS,
    },
    {
      text: "Reads (.fasta)",
      value: DOWNLOAD_READS,
    },
  ];

  const downloadButton = (
    <ButtonIcon
      className={cx(cs.downloadIcon, showHoverActions && cs.showHoverActions)}
      sdsSize="small"
      sdsType="primary"
      sdsIcon={"download"}
    />
  );

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
        <BareDropdown
          className={cs.hoverAction}
          hideArrow
          fluid
          trigger={downloadButton}
          options={downloadOptions}
          onChange={(value: string) =>
            downloadAmrGeneLevelData(value, geneId, geneName, workflowRunId)
          }
          onOpen={() => setShowHoverActions(true)}
          onClose={() => setShowHoverActions(false)}
          usePortal
        />
      )}
    </span>
  );
};
