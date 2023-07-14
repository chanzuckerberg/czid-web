import { MenuItem, Tooltip } from "@czi-sds/components";
import React from "react";
import { TwoWayKeyStringMap } from "~/components/utils/objectUtil";
import { downloadAmrGeneLevelData } from "~/components/views/SampleView/components/SampleViewHeader/PrimaryHeaderControls/AmrDownloadDropdown/amrDownloadUtils";
import {
  DOWNLOAD_CONTIGS,
  DOWNLOAD_READS,
} from "~/components/views/SampleView/constants";
import { SDSFormattedDropdownOption } from "~/interface/dropdown";

const DOWNLOAD_TYPE_TO_NAME = new TwoWayKeyStringMap({
  [DOWNLOAD_CONTIGS]: "Contigs (.fasta)",
  [DOWNLOAD_READS]: "Reads (.fasta)",
});

export const geneLevelDownloadOptions: SDSFormattedDropdownOption[] = [
  {
    name: DOWNLOAD_TYPE_TO_NAME.get(DOWNLOAD_CONTIGS),
  },
  {
    name: DOWNLOAD_TYPE_TO_NAME.get(DOWNLOAD_READS),
  },
];

interface GeneLevelDownloadOptionProps {
  contigs: string | null;
  geneId: string;
  geneName: string;
  option: SDSFormattedDropdownOption;
  reads: string | null;
  workflowRunId: number;
}

export const RenderedGeneLevelDownloadOption = ({
  contigs,
  geneId,
  geneName,
  option,
  reads,
  workflowRunId,
}: GeneLevelDownloadOptionProps) => {
  const onOptionClick = value => {
    downloadAmrGeneLevelData(value, geneId, geneName, workflowRunId);
  };
  const tooltipText = {
    [DOWNLOAD_CONTIGS]: "There are no contigs for this gene",
    [DOWNLOAD_READS]: "There are no reads for this gene",
  };
  const isContigDownloadDisabled =
    option.name === DOWNLOAD_TYPE_TO_NAME.get(DOWNLOAD_CONTIGS) &&
    (contigs === "0" || contigs === null);
  const isReadDownloadDisabled =
    option.name === DOWNLOAD_TYPE_TO_NAME.get(DOWNLOAD_READS) &&
    (reads === "0" || reads === null);

  let title = "";
  if (isContigDownloadDisabled) {
    title = tooltipText[DOWNLOAD_CONTIGS];
  } else if (isReadDownloadDisabled) {
    title = tooltipText[DOWNLOAD_READS];
  }
  return (
    <Tooltip
      arrow
      key={`download-${geneName}-${option.name}`}
      title={title}
      placement="right"
      sdsStyle="light"
    >
      <span>
        <MenuItem
          onClick={() =>
            onOptionClick(DOWNLOAD_TYPE_TO_NAME.revGet(option.name))
          }
          disabled={isContigDownloadDisabled || isReadDownloadDisabled}
        >
          {option.name}
        </MenuItem>
      </span>
    </Tooltip>
  );
};
