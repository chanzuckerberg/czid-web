import { Tooltip } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import { TaxonOption } from "~/components/common/filters/types";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import IssueGroup from "~/components/ui/notifications/IssueGroup";
import commonStyles from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { UploadWorkflows } from "~/components/views/SampleUploadFlow/constants";
import { REF_SEQ_FILE_NAME_ERROR_MESSAGE } from "../../../UploadSampleStep/constants";
import { WorkflowLinksConfig } from "../../workflowTypeConfig";
import { PipelineVersionIndicator } from "../PipelineVersionIndicator";
import { TooltipIcon } from "../TooltipIcon";
import { UploadButton } from "./components/UploadButton";
import { UploadedFileName } from "./components/UploadedFileName";
import { UploadTaxonFilter } from "./components/UploadTaxonFilter";
import cs from "./viral_consensus_genmone_sequencing_platform_options.scss";

interface ViralConsensusGenomeSequencingPlatformOptionsProps {
  bedFileName: string;
  refSeqFileName: string;
  hasRefSeqFileNameError: boolean;
  selectedTaxon: TaxonOption;
  onBedFileChanged(file?: File): void;
  onRefSeqFileChanged(file?: File): void;
  onTaxonChange(taxa: TaxonOption): void;
  pipelineVersion?: string;
  latestMajorVersion?: string;
}

const ViralConsensusGenomeSequencingPlatformOptions = ({
  bedFileName,
  refSeqFileName,
  hasRefSeqFileNameError,
  selectedTaxon,
  onBedFileChanged,
  onRefSeqFileChanged,
  onTaxonChange,
  pipelineVersion,
  latestMajorVersion,
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

  const { pipelineVersionLink, warningLink } =
    WorkflowLinksConfig[UploadWorkflows.VIRAL_CONSENSUS_GENOME];

  return (
    <>
      <div
        className={cx(commonStyles.technologyContent, "noStyleButton")}
        onClick={e => e.stopPropagation()}
      >
        <PipelineVersionIndicator
          version={pipelineVersion}
          isPipelineVersion={true}
          versionHelpLink={pipelineVersionLink}
          warningHelpLink={warningLink}
          isNewVersionAvailable={pipelineVersion?.[0] !== latestMajorVersion}
        />
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
      {hasRefSeqFileNameError && (
        <IssueGroup
          caption={REF_SEQ_FILE_NAME_ERROR_MESSAGE}
          headers={["File Name"]}
          rows={[[refSeqFileName]]}
          toggleable={false}
          type="warning"
          className={cs.error}
        />
      )}
    </>
  );
};

export { ViralConsensusGenomeSequencingPlatformOptions };
