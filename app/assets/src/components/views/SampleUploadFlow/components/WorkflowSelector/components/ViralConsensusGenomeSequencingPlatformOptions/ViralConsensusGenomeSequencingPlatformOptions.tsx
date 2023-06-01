import cx from "classnames";
import { Tooltip } from "czifui";
import React from "react";
import { TaxonOption } from "~/components/common/filters/types";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import commonStyles from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { TooltipIcon } from "../TooltipIcon";
import { UploadButton } from "./components/UploadButton";
import { UploadedFileName } from "./components/UploadedFileName";
import { UploadTaxonFilter } from "./components/UploadTaxonFilter";
import cs from "./viral_consensus_genmone_sequencing_platform_options.scss";

interface ViralConsensusGenomeSequencingPlatformOptionsProps {
  bedFileName: string;
  refSeqFileName: string;
  selectedTaxon: TaxonOption;
  onBedFileChanged(file?: File): void;
  onRefSeqFileChanged(file?: File): void;
  onTaxonChange(taxa: TaxonOption): void;
}

const ViralConsensusGenomeSequencingPlatformOptions = ({
  bedFileName,
  refSeqFileName,
  selectedTaxon,
  onBedFileChanged,
  onRefSeqFileChanged,
  onTaxonChange,
}: ViralConsensusGenomeSequencingPlatformOptionsProps) => {
  const refFileTooltipText = (
    <div>
      Upload reference sequence (fasta format) you would like to map the reads
      against to create a consensus genome.{" "}
      <ExternalLink href="https://chanzuckerberg.zendesk.com/hc/en-us/articles/14783973727636-Upload-Consensus-Genome-Data-through-the-Web-App#reference-sequence">
        Learn More
      </ExternalLink>
    </div>
  );

  const bedFileTooltip = (
    <div>
      Upload a primer BED file to soft clip amplicon-based data.
      <br />
      <ExternalLink href="https://chanzuckerberg.zendesk.com/hc/en-us/articles/14783973727636-Upload-Consensus-Genome-Data-through-the-Web-App#trim-primers">
        Learn More
      </ExternalLink>
    </div>
  );

  return (
    <div
      className={cx(commonStyles.technologyContent, "noStyleButton")}
      onClick={e => e.stopPropagation()}
    >
      <div className={commonStyles.item}>
        <div className={commonStyles.subheader}>
          Taxon Name
          <Tooltip
            arrow
            placement="top"
            title="Include the taxon name of the reference sequence to help you search generated genomes."
          >
            <TooltipIcon />
          </Tooltip>
        </div>
        <div className={cs.dropdown}>
          <UploadTaxonFilter
            selectedTaxon={selectedTaxon}
            onChange={onTaxonChange}
          />
        </div>
      </div>

      <div className={commonStyles.item}>
        <div className={commonStyles.subheader}>
          Reference Sequence
          <Tooltip arrow placement="top" title={refFileTooltipText}>
            <TooltipIcon />
          </Tooltip>
        </div>
        {refSeqFileName ? (
          <UploadedFileName
            fileName={refSeqFileName}
            onFileChanged={onRefSeqFileChanged}
          />
        ) : (
          <UploadButton
            fileTypes={[".fasta", ".fa", "fasta.gz", ".fa.gz"]}
            onFileChanged={onRefSeqFileChanged}
            data-testid="reference-sequence-file-upload"
          />
        )}
      </div>

      <div className={commonStyles.item}>
        <div className={commonStyles.subheader}>
          <span>Trim Primers</span>
          <span className={cs.optional}> &mdash; Optional</span>
          <Tooltip arrow placement="top" title={bedFileTooltip}>
            <TooltipIcon />
          </Tooltip>
        </div>
        {bedFileName ? (
          <UploadedFileName
            fileName={bedFileName}
            onFileChanged={onBedFileChanged}
          />
        ) : (
          <UploadButton
            fileTypes={[".bed", ".bed.gz"]}
            onFileChanged={onBedFileChanged}
          />
        )}
      </div>
    </div>
  );
};

export { ViralConsensusGenomeSequencingPlatformOptions };
