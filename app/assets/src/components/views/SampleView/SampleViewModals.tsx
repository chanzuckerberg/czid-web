import React from "react";
import { ANALYTICS_EVENT_NAMES } from "~/api/analytics";
import ErrorModal from "~/components/ui/containers/ErrorModal";
import { BlastData } from "~/interface/sampleView";
import BlastContigsModal from "../blast/BlastContigsModal";
import BlastReadsModal from "../blast/BlastReadsModal";
import BlastSelectionModal from "../blast/BlastSelectionModal";
import BlastV1ContigsModal from "../blast/BlastV1ContigsModal";
import BlastV1ReadsModal from "../blast/BlastV1ReadsModal";
import ConsensusGenomeCreationModal from "../consensus_genome/ConsensusGenomeCreationModal";
import ConsensusGenomePreviousModal from "../consensus_genome/ConsensusGenomePreviousModal";

interface SampleViewModalsProps {
  consensusGenomeCreationModalVisible;
  consensusGenomeData;
  onConsensusGenomeCreation;
  sample;
  consensusGenomePreviousModalVisible;
  consensusGenomePreviousParams;
  handleConsensusGenomeClick;
  handlePreviousConsensusGenomeReportClick;
  consensusGenomeErrorModalVisible;
  handleConsensusGenomeErrorModalRetry;
  blastSelectionModalVisible;
  handleBlastSelectionModalContinue;
  blastData: BlastData;
  blastModalInfo;
  blastContigsModalVisible;
  blastReadsModalVisible;
  blastV1ContigsModalVisible;
  blastV1ReadsModalVisible;
  handleModalClose;
}

const SampleViewModals = ({
  consensusGenomeCreationModalVisible,
  consensusGenomeData,
  onConsensusGenomeCreation,
  sample,
  consensusGenomePreviousModalVisible,
  consensusGenomePreviousParams,
  handleConsensusGenomeClick,
  handlePreviousConsensusGenomeReportClick,
  consensusGenomeErrorModalVisible,
  handleConsensusGenomeErrorModalRetry,
  blastSelectionModalVisible,
  handleBlastSelectionModalContinue,
  blastData,
  blastModalInfo,
  blastContigsModalVisible,
  blastReadsModalVisible,
  blastV1ContigsModalVisible,
  blastV1ReadsModalVisible,
  handleModalClose,
}: SampleViewModalsProps) => {
  return (
    <>
      {consensusGenomeCreationModalVisible && (
        <ConsensusGenomeCreationModal
          consensusGenomeData={consensusGenomeData}
          onClose={() =>
            handleModalClose("consensusGenomeCreationModalVisible")
          }
          onCreation={onConsensusGenomeCreation}
          open={consensusGenomeCreationModalVisible}
          sample={sample}
        />
      )}
      {consensusGenomePreviousModalVisible && (
        <ConsensusGenomePreviousModal
          consensusGenomeData={consensusGenomePreviousParams}
          onClose={() =>
            handleModalClose("consensusGenomePreviousModalVisible")
          }
          onNew={handleConsensusGenomeClick}
          onRowClick={handlePreviousConsensusGenomeReportClick}
          open={consensusGenomePreviousModalVisible}
          sample={sample}
        />
      )}
      {consensusGenomeErrorModalVisible && (
        <ErrorModal
          helpLinkEvent={
            ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_ERROR_MODAL_HELP_LINK_CLICKED
          }
          labelText="Failed"
          open={consensusGenomeErrorModalVisible}
          onCancel={() => handleModalClose("consensusGenomeErrorModalVisible")}
          onConfirm={handleConsensusGenomeErrorModalRetry}
          title={
            "Sorry! There was an error starting your consensus genome run."
          }
        />
      )}
      {blastSelectionModalVisible && (
        <BlastSelectionModal
          open={blastSelectionModalVisible}
          onContinue={handleBlastSelectionModalContinue}
          onClose={() => handleModalClose("blastSelectionModalVisible")}
          taxonName={blastData?.taxName}
          taxonStatsByCountType={blastData?.taxonStatsByCountType}
        />
      )}
      {/* These are the BLAST v0 modals that will be removed once BLAST v1 is released **/}
      {blastContigsModalVisible && (
        <BlastContigsModal
          open={blastContigsModalVisible}
          onClose={() => handleModalClose("blastContigsModalVisible")}
          context={blastData?.context}
          pipelineVersion={blastData?.pipelineVersion}
          sampleId={blastData?.sampleId}
          taxonName={blastData?.taxName}
          taxonId={blastData?.taxId}
        />
      )}
      {blastReadsModalVisible && (
        <BlastReadsModal
          open={blastReadsModalVisible}
          onClose={() => handleModalClose("blastReadsModalVisible")}
          context={blastData?.context}
          pipelineVersion={blastData?.pipelineVersion}
          sampleId={blastData?.sampleId}
          taxonName={blastData?.taxName}
          taxonLevel={blastData?.taxLevel}
          taxonId={blastData?.taxId}
        />
      )}
      {/* BLAST v1 modals **/}
      {blastV1ContigsModalVisible && (
        <BlastV1ContigsModal
          open={blastV1ContigsModalVisible}
          onClose={() => handleModalClose("blastV1ContigsModalVisible")}
          blastModalInfo={blastModalInfo}
          context={blastData?.context}
          pipelineVersion={blastData?.pipelineVersion}
          sampleId={blastData?.sampleId}
          taxonName={blastData?.taxName}
          taxonId={blastData?.taxId}
        />
      )}
      {blastV1ReadsModalVisible && (
        <BlastV1ReadsModal
          open={blastV1ReadsModalVisible}
          onClose={() => handleModalClose("blastV1ReadsModalVisible")}
          blastModalInfo={blastModalInfo}
          context={blastData?.context}
          pipelineVersion={blastData?.pipelineVersion}
          sampleId={blastData?.sampleId}
          taxonName={blastData?.taxName}
          taxonLevel={blastData?.taxLevel}
          taxonId={blastData?.taxId}
        />
      )}
    </>
  );
};

export default SampleViewModals;