import { Button, Icon } from "@czi-sds/components";
import { isNull } from "lodash/fp";
import React, { useState } from "react";
import { graphql, useMutation } from "react-relay";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import { getCsrfToken } from "~/api/utils";
import ErrorModal from "~/components/ui/containers/ErrorModal";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { VIRAL_CONSENSUS_GENOME_DOC_LINK } from "~/components/utils/documentationLinks";
import { logError } from "~/components/utils/logUtil";
import { WorkflowType } from "~/components/utils/workflows";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";
import Sample, { WorkflowRun } from "~/interface/sample";
import { ConsensusGenomeParams, ModalsVisible } from "~/interface/sampleView";
import { ConsensusGenomeData } from "~/interface/shared";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import Modal from "~ui/containers/Modal";
import { SubtextDropdown } from "~ui/controls/dropdowns";
import cs from "./consensus_genome_creation_modal.scss";

const ConsensusGenomeCreationModalMutation = graphql`
  mutation ConsensusGenomeCreationModalMutation(
    $sampleId: String!
    $input: mutationInput_KickoffWGSWorkflow_input_Input
  ) {
    KickoffWGSWorkflow(sampleId: $sampleId, input: $input) {
      id
      status
      workflow
      deprecated
      executed_at
      input_error
      run_finalized
      wdl_version
      parsed_cached_results {
        quality_metrics {
          total_reads
          qc_percent
          adjusted_remaining_reads
          compression_ratio
          total_ercc_reads
          fraction_subsampled
          insert_size_mean
          insert_size_standard_deviation
          percent_remaining
        }
      }
      inputs {
        accession_id
        accession_name
        taxon_id
        taxon_name
        technology
        card_version
        wildcard_version
      }
    }
  }
`;
interface ConsensusGenomeCreationModalProps {
  consensusGenomeData: ConsensusGenomeData;
  handleModalAction: (modals: ["open" | "close", string][]) => void;
  open?: boolean;
  onClose: () => void;
  sample: Sample;
  handleConsensusGenomeKickoff: (
    workflowRuns: WorkflowRun[],
    sample: Sample,
  ) => Promise<void>;
  modalsVisible: ModalsVisible;
}

export const ConsensusGenomeCreationModal = ({
  consensusGenomeData,
  handleModalAction,
  onClose,
  open,
  sample,
  modalsVisible,
  handleConsensusGenomeKickoff,
}: ConsensusGenomeCreationModalProps) => {
  const [selectedAccessionIndex, setSelectedAccessionIndex] = useState<
    number | null
  >(null);
  const trackEvent = useTrackEvent();
  const [commitMutation, isInFlight] = useMutation(
    ConsensusGenomeCreationModalMutation,
  );

  const onConsensusGenomeCreation = async (
    consensusGenomeCreationParams: ConsensusGenomeParams,
  ) => {
    try {
      commitMutation({
        variables: {
          sampleId: sample.id.toString(),
          input: {
            workflow: WorkflowType.CONSENSUS_GENOME,
            inputs_json: {
              accession_id: consensusGenomeCreationParams.accessionId,
              accession_name: consensusGenomeCreationParams.accessionName,
              taxon_id: consensusGenomeCreationParams.taxonId?.toString(),
              taxon_name: consensusGenomeCreationParams.taxonName,
              alignment_config_name:
                sample?.pipeline_runs?.[0]?.alignment_config_name,
              technology: SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA,
            },
            authenticityToken: getCsrfToken(),
          },
        },
        onCompleted(workflowRuns: { KickoffWGSWorkflow: WorkflowRun[] }) {
          handleConsensusGenomeKickoff(workflowRuns.KickoffWGSWorkflow, sample);
        },
        onError(error) {
          console.error(error);
          handleModalAction([["open", "consensusGenomeError"]]);
        },
      });
    } catch (error) {
      console.error(error);
      handleModalAction([["open", "consensusGenomeError"]]);
    }
  };

  const handleConsensusGenomeCreate = (retry?: string) => {
    const { accessionData, taxId, taxName } = consensusGenomeData;
    if (
      !accessionData ||
      isNull(selectedAccessionIndex) ||
      !taxId ||
      !taxName
    ) {
      logError({
        message:
          "ModalManage: handleConsensusGenomeCreate called with invalid params",
        details: { accessionData, taxId, taxName, retry },
      });
      return;
    }
    const selectedAccession =
      accessionData.best_accessions[selectedAccessionIndex];

    onConsensusGenomeCreation({
      accessionId: selectedAccession.id,
      accessionName: selectedAccession.name,
      taxonId: taxId,
      taxonName: taxName,
    });

    trackEvent(
      ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED,
      {
        accessionId: selectedAccession.id,
        accessionName: selectedAccession.name,
        taxonId: taxId,
        taxonName: taxName,
        sampleId: sample.id,
      },
    );
  };

  const getReferenceAccessions = () => {
    const { accessionData, percentIdentity, usedAccessions } =
      consensusGenomeData;

    // If accessionData doesn't exist, just pass an empty list.
    if (!accessionData) {
      return [];
    }

    return accessionData.best_accessions.map((data, index) => {
      const disabled = usedAccessions?.includes(data.id);
      const subtext = `${percentIdentity} %id, ${getSequenceCompleteness(
        data.name,
      )}, ${data.coverage_depth}x coverage`;

      return {
        disabled,
        subtext,
        text: data.name,
        value: index,
        ...(disabled && {
          tooltip:
            "A consensus genome has already been generated for this accession",
        }),
      };
    });
  };

  const getSequenceCompleteness = (accessionName: string) => {
    if (accessionName.includes("partial")) {
      return "Partial Sequence";
    } else if (accessionName.includes("complete")) {
      return "Complete Sequence";
    }
  };

  const handleAccessionChange = (accessionIndex: number) => {
    if (accessionIndex === selectedAccessionIndex) {
      return;
    }
    setSelectedAccessionIndex(accessionIndex);
  };

  return (
    <>
      <Modal
        className={cs.modal}
        narrow
        open={open}
        minimumHeight
        onClose={onClose}
        data-testid="create-consensus-genome-modal"
      >
        <div className={cs.title}>Generate Consensus Genome</div>
        <div className={cs.description}>
          Align non-host reads to the reference accession of choice to generate
          a consensus genome for this taxon. This pipeline should not be used on
          samples using enrichment protocols such as MSSPE.{" "}
          <ExternalLink href={VIRAL_CONSENSUS_GENOME_DOC_LINK}>
            Learn more.
          </ExternalLink>
        </div>
        <div className={cs.label}>
          Taxon:{" "}
          <span className={cs.taxonName}>{consensusGenomeData.taxName}</span>
        </div>
        <div className={cs.label}>
          Reference Accession
          <ColumnHeaderTooltip
            trigger={
              <span>
                <Icon
                  sdsIcon="infoCircle"
                  sdsSize="s"
                  sdsType="interactive"
                  className={cs.infoIcon}
                />
              </span>
            }
            content={
              "Choose the reference accession you would like to map the non-host reads against to create a consensus genome."
            }
            link={VIRAL_CONSENSUS_GENOME_DOC_LINK}
            position={"top center"}
          />
        </div>
        <SubtextDropdown
          className={cs.dropdown}
          fluid
          options={getReferenceAccessions()}
          onChange={handleAccessionChange}
          placeholder="Select a reference accession"
        />
        <Button
          className={cs.button}
          sdsType="primary"
          sdsStyle="rounded"
          onClick={handleConsensusGenomeCreate}
          disabled={isInFlight}
          startIcon={
            isInFlight ? (
              <Icon sdsIcon={"loading"} sdsSize="l" sdsType="button" />
            ) : undefined
          }
        >
          {!isInFlight
            ? "Create Consensus Genome"
            : "Creating Consensus Genome"}
        </Button>
      </Modal>
      <ErrorModal
        labelText="Failed"
        open={modalsVisible.consensusGenomeError}
        onCancel={() => handleModalAction([["close", "consensusGenomeError"]])}
        onConfirm={() => handleConsensusGenomeCreate("retry")}
        title={"Sorry! There was an error starting your consensus genome run."}
      />
    </>
  );
};
