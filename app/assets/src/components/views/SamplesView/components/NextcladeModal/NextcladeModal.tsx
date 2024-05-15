import { Icon } from "@czi-sds/components";
import { cx } from "@emotion/css";
import { difference } from "lodash/fp";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { createConsensusGenomeCladeExport, getWorkflowRunsInfo } from "~/api";
import { validateWorkflowRunIds } from "~/api/access_control";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import ErrorModal from "~/components/ui/containers/ErrorModal";
import Modal from "~/components/ui/containers/Modal";
import List from "~/components/ui/List";
import {
  NEXTCLADE_APP_LINK,
  NEXTCLADE_REFERENCE_TREE_LINK,
} from "~/components/utils/documentationLinks";
import { openUrlInNewTab } from "~/components/utils/links";
import { WorkflowType } from "~/components/utils/workflows";
import { CreationSource } from "~/interface/sample";
import { SARS_COV_2 } from "../../constants";
import { NextcladeConfirmationModal } from "./components/NextcladeConfirmationModal";
import { NextcladeModalFooter } from "./components/NextcladeModalFooter";
import { NextcladeReferenceTreeOptions } from "./components/NextcladeReferenceTreeOptions";
import cs from "./nextclade_modal.scss";

interface NextcladeModalProps {
  onClose: $TSFixMeFunction;
  isOpen?: boolean;
  selectedIds?: Set<$TSFixMe>;
}

enum SelectedTreeType {
  GLOBAL = "global",
  UPLOAD = "upload",
}

export const NextcladeModal = ({
  onClose,
  isOpen,
  selectedIds,
}: NextcladeModalProps) => {
  const { admin: isAdmin, userId } = useContext(UserContext);
  const trackEvent = useTrackEvent();

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [invalidSampleNames, setInvalidSampleNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [samplesNotSentToNextclade, setSamplesNotSentToNextclade] = useState<
    string[]
  >([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [referenceTree, setReferenceTree] = useState<File | null>(null);
  const [selectedTreeType, setSelectedTreeType] = useState<SelectedTreeType>(
    SelectedTreeType.GLOBAL,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validWorkflowRunIds, setValidWorkflowRunIds] = useState(
    new Set<string>(),
  );
  const [validWorkflowInfo, setValidWorkflowInfo] = useState<$TSFixMe[]>([]);
  const [referenceTreeContents, setReferenceTreeContents] = useState<
    string | null
  >(null);

  const fetchValidationInfo = useCallback(async () => {
    if (!selectedIds) {
      return null;
    }
    const { validIds, invalidSampleNames, error } =
      await validateWorkflowRunIds({
        basic: false,
        workflowRunIds: Array.from(selectedIds),
        workflow: WorkflowType.CONSENSUS_GENOME,
      });

    const { workflowRunInfo } = await getWorkflowRunsInfo(validIds);

    const projectIds = workflowRunInfo.map(workflow => workflow.projectId);

    // WGS samples cannot be sent to nextclade, and other cg uploads can only
    // be sent if they are SC2 samples, even if they are uploaded via cli
    const samplesNotSentToNextclade = workflowRunInfo
      .filter(
        cg =>
          cg.taxonName !== SARS_COV_2 ||
          cg.creationSource === CreationSource.WGS,
      )
      .map(cg => cg.name);

    setInvalidSampleNames(invalidSampleNames);
    setIsLoading(false);
    setSamplesNotSentToNextclade(samplesNotSentToNextclade);
    setValidationError(error);
    setValidWorkflowRunIds(new Set(validIds));
    setValidWorkflowInfo(workflowRunInfo);
    setProjectIds(projectIds);
  }, [selectedIds]);

  useEffect(() => {
    fetchValidationInfo();
  }, [fetchValidationInfo]);

  const checkAdminSelections = useCallback(() => {
    if (isAdmin) {
      const selectedOwnerIds = validWorkflowInfo.map(
        workflow => workflow.userId,
      );
      if (difference(selectedOwnerIds, [userId]).length) {
        window.alert(
          "Admin warning: You have selected consensus genomes that belong to other users. Double-check that you have permission to send to Nextclade for production consensus genomes.",
        );
      }
    }
  }, [isAdmin, userId, validWorkflowInfo]);

  useEffect(() => {
    checkAdminSelections();
  }, [checkAdminSelections, validWorkflowInfo]);

  const openExportLink = async () => {
    const link = await createConsensusGenomeCladeExport({
      workflowRunIds: Array.from(validWorkflowRunIds),
      referenceTree:
        selectedTreeType === "upload" ? referenceTreeContents : null,
    });
    openUrlInNewTab(link.external_url);
  };

  const handleFileUpload = async (file: File) => {
    // Stringify, then parse to remove excess whitespace
    const fileContents = JSON.stringify(JSON.parse(await file.text()));
    setReferenceTree(file);
    setReferenceTreeContents(fileContents);
  };

  const handleSelectTreeType = (treeType: SelectedTreeType) => {
    setSelectedTreeType(treeType);
  };

  const handleOpenConfirmationModal = () => {
    setIsConfirmationModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
  };

  const handleConfirmationModalConfirm = async () => {
    try {
      setIsLoadingResults(true);

      // TODO: (ehoops) Checking with Kami to determine which of these has the correct types
      trackEvent(
        ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED,
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
          workflowRunIds: Array.from(validWorkflowRunIds),
          selectedTreeType,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
          projectIds,
        },
      );
      trackEvent(
        ANALYTICS_EVENT_NAMES.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED_ALLISON_TESTING,
        {
          workflowRunIds: JSON.stringify(Array.from(validWorkflowRunIds)),
          selectedTreeType,
          projectIds: JSON.stringify(projectIds),
        },
      );

      await openExportLink();
      setIsConfirmationModalOpen(false);
      onClose();
    } catch (error) {
      setIsConfirmationModalOpen(false);
      setIsErrorModalOpen(true);
      setIsLoadingResults(false);
      console.error(error);
    }
  };

  const handleErrorModalRetry = async () => {
    try {
      await openExportLink();
      setIsErrorModalOpen(false);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseErrorModal = () => {
    setIsErrorModalOpen(false);
  };

  const sentToNextcladeCount = selectedIds
    ? selectedIds.size - samplesNotSentToNextclade.length
    : 0;

  return (
    <Modal narrow open={isOpen} tall onClose={onClose}>
      <div className={cs.modal}>
        <div className={cs.nextcladeHeader}>
          <div className={cs.title}>
            View Consensus Genomes in Nextclade
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
                "Nextclade is a third-party tool and has its own policies."
              }
              link={NEXTCLADE_APP_LINK}
              offset={[0, 0]}
              position={"top center"}
            />
          </div>
          <div className={cs.tagline}>
            {sentToNextcladeCount} Consensus Genome
            {sentToNextcladeCount !== 1 ? "s" : ""} selected
          </div>
        </div>
        <div className={cs.nextcladeDescription}>
          <div className={cs.title}> Nextclade helps you: </div>
          <List
            listItems={[
              `Assess sequence quality`,
              `See where your consensus genomes differ from the reference sequence`,
              `Identify which clade or lineage your consensus genomes belong to`,
              <>
                View consensus genome placement in the context of a Nextstrain{" "}
                <br />
                phylogenetic tree
                <ColumnHeaderTooltip
                  trigger={
                    <span>
                      <Icon
                        sdsIcon="infoCircle"
                        sdsSize="s"
                        sdsType="interactive"
                        className={cx(cs.infoIcon, cs.lower)}
                      />
                    </span>
                  }
                  content={
                    "Exercise caution when interpreting this tree. Nextclade’s algorithms are meant for quick assessments and not a replacement for full analysis with the Nextstrain pipeline."
                  }
                  offset={[11, 0]}
                  position={"top right"}
                />
              </>,
            ]}
          />
        </div>
        <div className={cs.referenceTree}>
          <div className={cs.title}>
            Reference Tree
            <ColumnHeaderTooltip
              trigger={
                <span>
                  <Icon
                    sdsIcon="infoCircle"
                    sdsSize="s"
                    sdsType="interactive"
                    className={cx(cs.infoIcon, cs.lower)}
                  />
                </span>
              }
              content={
                "Nextclade will graft your sequences onto the reference tree to provide more context."
              }
              link={NEXTCLADE_REFERENCE_TREE_LINK}
              offset={[0, 0]}
              position={"top center"}
            />
          </div>
          <div className={cs.options}>
            <NextcladeReferenceTreeOptions
              referenceTree={referenceTree && referenceTree.name}
              onChange={handleFileUpload}
              onSelect={handleSelectTreeType}
              selectedType={selectedTreeType}
            />
          </div>
        </div>
        <div className={cs.footer}>
          <NextcladeModalFooter
            onClick={handleOpenConfirmationModal}
            invalidSampleNames={invalidSampleNames}
            loading={isLoading}
            samplesNotSentToNextclade={samplesNotSentToNextclade}
            validationError={validationError}
            hasValidIds={validWorkflowRunIds && validWorkflowRunIds.size > 0}
          />
        </div>
      </div>
      {isConfirmationModalOpen && (
        <NextcladeConfirmationModal
          open
          onCancel={handleCloseConfirmationModal}
          onConfirm={handleConfirmationModalConfirm}
          loading={isLoadingResults}
        />
      )}
      {isErrorModalOpen && (
        <ErrorModal
          labelText="Failed to send"
          open
          onCancel={handleCloseErrorModal}
          onConfirm={handleErrorModalRetry}
          title={
            "Sorry! There was an error sending your consensus genomes to Nextclade."
          }
        />
      )}
    </Modal>
  );
};
