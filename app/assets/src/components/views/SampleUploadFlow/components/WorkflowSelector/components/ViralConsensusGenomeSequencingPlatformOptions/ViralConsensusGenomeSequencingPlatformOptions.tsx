import cx from "classnames";
import { Tooltip } from "czifui";
import React from "react";
import cs from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { TooltipIcon } from "../TooltipIcon";
import { UploadButton } from "./components/UploadButton";

const ViralConsensusGenomeSequencingPlatformOptions = () => {
  return (
    <button
      className={cx(cs.technologyContent, "noStyleButton")}
      onClick={e => e.stopPropagation()}
    >
      <div className={cs.item}>
        <div className={cs.subheader}>
          Taxon Name
          <Tooltip
            arrow
            placement="top"
            title="Include the taxon name of the reference sequence to help you search generated genomes."
          >
            <TooltipIcon />
          </Tooltip>
        </div>
      </div>

      <div className={cs.item}>
        <div className={cs.subheader}>
          Reference Sequence
          <Tooltip
            arrow
            placement="top"
            title="Upload reference sequence (fasta format) you would like to map the reads against to create a consensus genome. Learn More" // TODO (mlila): learn more link
          >
            <TooltipIcon />
          </Tooltip>
        </div>
        <UploadButton />
      </div>

      <div className={cs.item}>
        <div className={cs.subheader}>
          Trim Primers
          <Tooltip
            arrow
            placement="top"
            title="Upload a primer BED file to soft clip amplicon-based data. Learn More" // TODO (mlila): learn more link
          >
            <TooltipIcon />
          </Tooltip>
        </div>
        <UploadButton />
      </div>
    </button>
  );
};

export { ViralConsensusGenomeSequencingPlatformOptions };
